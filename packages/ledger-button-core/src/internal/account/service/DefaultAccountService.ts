import { ethers } from "ethers";
import { type Factory, inject, injectable } from "inversify";

import { alpacaModuleTypes } from "../../alpaca/alpacaModuleTypes.js";
import { type AlpacaBalanceResponse, type TokenBalance } from "../../alpaca/model/types.js";
import { type AlpacaService } from "../../alpaca/service/AlpacaService.js";
import { backendModuleTypes } from "../../backend/backendModuleTypes.js";
import type { BackendService } from "../../backend/BackendService.js";
import { getChainIdFromCurrencyId } from "../../blockchain/evm/chainUtils.js";
import { dAppConfigModuleTypes } from "../../dAppConfig/di/dAppConfigModuleTypes.js";
import { type DAppConfigService } from "../../dAppConfig/service/DAppConfigService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import { type StorageService } from "../../storage/StorageService.js";
import { Account, AccountService, CloudSyncData, Token } from "./AccountService.js";

@injectable()
export class DefaultAccountService implements AccountService {
  private readonly logger: LoggerPublisher;
  accounts: Account[] = [];
  selectedAccount: Account | null = null;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(dAppConfigModuleTypes.DAppConfigService)
    private readonly dAppConfigService: DAppConfigService,
    @inject(backendModuleTypes.BackendService)
    private readonly backendService: BackendService,
    @inject(alpacaModuleTypes.AlpacaService)
    private readonly alpacaService: AlpacaService,
  ) {
    this.logger = this.loggerFactory("[Account Service]");
  }

  async setAccountsFromCloudSyncData(
    cloudsyncData: CloudSyncData,
  ): Promise<void> {
    const mappedAccounts = await this.mapCloudSyncDataToAccounts(cloudsyncData);

    const accountsWithBalance =
      await this.getAccountsWithBalance(mappedAccounts);
    console.log("Accounts with balance", accountsWithBalance);

    this.setAccounts(accountsWithBalance);
  }

  selectAccount(address: string): void {
    const found = this.accounts.find(
      (account) => account.freshAddress === address,
    );

    if (found) {
      this.selectedAccount = found;
      this.logger.info("Account selected, saving to storage", {
        account: found,
      });
      this.storageService.saveSelectedAccount(found);
    }
  }

  getSelectedAccount(): Account | null {
    return this.selectedAccount;
  }

  getAccounts(): Account[] {
    return this.accounts;
  }

  private setAccounts(accounts: Account[]) {
    this.accounts = accounts;
    this.logger.debug("saving accounts", { accounts: this.accounts });
  }

  private async mapCloudSyncDataToAccounts(
    cloudSyncData: CloudSyncData,
  ): Promise<Account[]> {
    const { accounts, accountNames } = cloudSyncData;
    const supportedBlockchains = (await this.dAppConfigService.getDAppConfig())
      .supportedBlockchains;

    return accounts
      .map((account) => {
        const blockchain = supportedBlockchains.find(
          (blockchain) => blockchain.currency_id === account.currencyId,
        );

        const name =
          accountNames[account.id] ??
          `${blockchain?.currency_name} Account ${account.index}`;

        const ticker = blockchain?.currency_ticker;
        console.log(
          "ticker for blockchain",
          blockchain,
          account.currencyId,
          ticker,
        );
        return ticker
          ? ({
              ...account,
              name,
              ticker,
              derivationMode: account.derivationMode
                ? account.derivationMode
                : "44'/60'/0'/0/0",
              balance: undefined,
              tokens: [],
            } as Account)
          : undefined;
      })
      .filter((account) => account !== undefined);
  }

  private async getAccountsWithBalance(
    accounts: Account[],
  ): Promise<Account[]> {
    const accountsWithBalanceAndTokens = await Promise.all(
      accounts.map(async (account: Account) => {
        this.logger.debug("Fetching balance and tokens for account", {
          address: account.freshAddress,
          currencyId: account.currencyId,
        });

        const alpacaResult = await this.alpacaService.getBalance({
          address: account.freshAddress,
          currencyId: account.currencyId,
        });

        if (alpacaResult.isLeft()) {
          this.logger.warn("Failed to fetch balance from Alpaca service, falling back to backend", {
            error: alpacaResult.extract(),
            address: account.freshAddress,
          });

          // Fallback to the original backend method
          const chainId = getChainIdFromCurrencyId(account.currencyId);
          const balanceResult = await this.backendService.broadcast({
            blockchain: { name: "ethereum", chainId: chainId },
            rpc: {
              method: "eth_getBalance",
              params: [account.freshAddress, "latest"],
              id: 1,
              jsonrpc: "2.0",
            },
          });

          let balance = "0.0000";
          if (balanceResult.isRight()) {
            const balanceHex = balanceResult.extract().result as string;
            balance = ethers.formatEther(balanceHex);
            balance =
              balance.split(".")[0] + "." + balance.split(".")[1].slice(0, 4);
          }

          return { ...account, balance, tokens: [] };
        }

        const alpacaData = alpacaResult.extract() as AlpacaBalanceResponse;

        const tokens: Token[] = alpacaData.tokenBalances.map((tokenBalance: TokenBalance) => ({
          address: tokenBalance.contractAddress,
          symbol: tokenBalance.symbol,
          name: tokenBalance.name,
          balance: tokenBalance.balanceFormatted,
        }));

        const balance = alpacaData.nativeBalance.balanceFormatted;

        this.logger.debug("Successfully fetched balance and tokens", {
          address: account.freshAddress,
          balance,
          tokenCount: tokens.length,
        });

        return { ...account, balance, tokens };
      }),
    );

    this.logger.debug("All accounts with balance and tokens", {
      accountCount: accountsWithBalanceAndTokens.length,
      totalTokensAcrossAccounts: accountsWithBalanceAndTokens.reduce((sum, acc) => sum + acc.tokens.length, 0)
    });

    return accountsWithBalanceAndTokens;
  }
}
