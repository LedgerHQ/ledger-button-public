import { ethers } from "ethers";
import { type Factory, inject, injectable } from "inversify";

import { NoCompatibleAccountsError } from "../../../api/errors/LedgerSyncErrors.js";
import { backendModuleTypes } from "../../backend/backendModuleTypes.js";
import type { BackendService } from "../../backend/BackendService.js";
import { balanceModuleTypes } from "../../balance/balanceModuleTypes.js";
import {
  type AccountBalance,
  type TokenBalance,
} from "../../balance/model/types.js";
import { type BalanceService } from "../../balance/service/BalanceService.js";
import { getChainIdFromCurrencyId } from "../../blockchain/evm/chainUtils.js";
import { dAppConfigModuleTypes } from "../../dAppConfig/di/dAppConfigModuleTypes.js";
import { type DAppConfigService } from "../../dAppConfig/service/DAppConfigService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import { type StorageService } from "../../storage/StorageService.js";
import {
  type Account,
  type AccountService,
  type CloudSyncData,
  type Token,
} from "./AccountService.js";

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
    @inject(balanceModuleTypes.BalanceService)
    private readonly balanceService: BalanceService,
  ) {
    this.logger = this.loggerFactory("[Account Service]");
  }

  async setAccountsFromCloudSyncData(
    cloudsyncData: CloudSyncData,
  ): Promise<void> {
    const mappedAccounts = await this.mapCloudSyncDataToAccounts(cloudsyncData);

    const accountsWithBalance =
      await this.getAccountsWithBalance(mappedAccounts);

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

    const accs = accounts
      .map((account) => {
        const blockchain = supportedBlockchains.find(
          (blockchain) => blockchain.currency_id === account.currencyId,
        );

        const name =
          accountNames[account.id] ??
          `${blockchain?.currency_name} Account ${account.index}`;

        const ticker = blockchain?.currency_ticker;
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

    if (accs.length === 0) {
      throw new NoCompatibleAccountsError("No accounts found", {
        networks: supportedBlockchains.map((network) => network.currency_name),
      });
    }

    return accs;
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

        const balanceResult =
          await this.balanceService.getBalanceForAccount(account);

        let balance = "0.0000";
        let tokens: Token[] = [];

        if (balanceResult.isRight()) {
          const balanceData = balanceResult.extract() as AccountBalance;
          balance = ethers.formatEther(balanceData.nativeBalance.balance);
          balance =
            balance.split(".")[0] + "." + balance.split(".")[1].slice(0, 4);

          tokens = balanceData.tokenBalances.map(
            (tokenBalance: TokenBalance) => ({
              ticker: tokenBalance.ticker,
              name: tokenBalance.name,
              balance: tokenBalance.balanceFormatted,
            }),
          );
        } else {
          //RPC fallback if balance service fails
          if (balanceResult.isLeft()) {
            const balanceError = balanceResult.extract();
            this.logger.warn(
              "Failed to fetch balance from balance service (Alpaca), falling back to backend and getting balance from RPC node",
              {
                error: balanceError,
                address: account.freshAddress,
              },
            );

            // Fallback to the original backend method
            const chainId = getChainIdFromCurrencyId(account.currencyId);
            const balanceRpcResult = await this.backendService.broadcast({
              blockchain: { name: "ethereum", chainId: chainId },
              rpc: {
                method: "eth_getBalance",
                params: [account.freshAddress, "latest"],
                id: 1,
                jsonrpc: "2.0",
              },
            });

            if (
              balanceRpcResult.isRight() &&
              balanceRpcResult.extract().result !== undefined // RPC do not return error but undefined
            ) {
              const balanceHex = balanceRpcResult.extract().result as string;
              balance = ethers.formatEther(balanceHex);
              balance =
                balance.split(".")[0] + "." + balance.split(".")[1].slice(0, 4);
            }

            return { ...account, balance, tokens: [] };
          }
        }

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
      totalTokensAcrossAccounts: accountsWithBalanceAndTokens.reduce(
        (sum, acc) => sum + acc.tokens.length,
        0,
      ),
    });

    return accountsWithBalanceAndTokens;
  }
}
