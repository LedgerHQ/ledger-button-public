import { type Factory, inject, injectable } from "inversify";

import type { BlockchainFamily } from "../../../api/blockchain-provider/model/types.js";
import { NoCompatibleAccountsError } from "../../../api/errors/LedgerSyncErrors.js";
import { dAppConfigV2ModuleTypes } from "../../dAppConfig/v2/di/dAppConfigV2ModuleTypes.js";
import { type GetDAppConfigV2UseCase } from "../../dAppConfig/v2/use-case/GetDAppConfigV2UseCase.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import { type StorageService } from "../../storage/StorageService.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import type { HydrateAccountWithBalanceUseCase } from "../use-case/HydrateAccountWithBalanceUseCase.js";
import {
  type Account,
  type AccountService,
  type CloudSyncData,
} from "./AccountService.js";

@injectable()
export class DefaultAccountService implements AccountService {
  private readonly logger: LoggerPublisher;
  accounts: Account[] = [];

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(dAppConfigV2ModuleTypes.GetDAppConfigV2UseCase)
    private readonly getDAppConfigV2UseCase: GetDAppConfigV2UseCase,
    @inject(accountModuleTypes.HydrateAccountWithBalanceUseCase)
    private readonly hydrateAccountWithBalanceUseCase: HydrateAccountWithBalanceUseCase,
  ) {
    this.logger = this.loggerFactory("Account Service");
  }

  async setAccountsFromCloudSyncData(
    cloudsyncData: CloudSyncData,
  ): Promise<void> {
    const mappedAccounts = await this.mapCloudSyncDataToAccounts(cloudsyncData);

    this.setAccounts(mappedAccounts);
  }

  selectAccount(account: Account, family: BlockchainFamily): void {
    const found = this.accounts.find((acc) => acc.id === account.id);

    if (found) {
      this.logger.info("Account selected, saving to storage", {
        account: found,
        family,
      });
      this.storageService.saveSelectedAccount(found, family);
    }
  }

  getAccounts(): Account[] {
    return this.accounts;
  }

  setAccounts(accounts: Account[]) {
    this.accounts = accounts;
    this.logger.debug("saving accounts", { accounts: this.accounts });
  }

  private async mapCloudSyncDataToAccounts(
    cloudSyncData: CloudSyncData,
  ): Promise<Account[]> {
    const { accounts, accountNames } = cloudSyncData;
    const dAppConfig = await this.getDAppConfigV2UseCase.execute();
    const supportedNetworks = dAppConfig.blockchains.flatMap(
      (blockchain) => blockchain.networks,
    );

    const accs = accounts
      .map((account) => {
        const network = supportedNetworks.find(
          (network) => network.currencyId === account.currencyId,
        );

        const name =
          accountNames[account.id] ??
          `${network?.currencyName} ${account.index + 1}`;

        const ticker = network?.currencyTicker;
        return ticker
          ? ({
              ...account,
              name,
              ticker,
              derivationMode: account.derivationMode
                ? account.derivationMode
                : "",
              balance: undefined,
              tokens: [],
            } as Account)
          : undefined;
      })
      .filter((account) => account !== undefined);

    if (accs.length === 0) {
      throw new NoCompatibleAccountsError("No accounts found", {
        networks: supportedNetworks.map((network) => network.currencyName),
      });
    }

    return accs;
  }

  async getBalanceAndTokensForAccount(
    account: Account,
    withTokens: boolean,
  ): Promise<Account> {
    return this.hydrateAccountWithBalanceUseCase.execute(account, withTokens);
  }
}
