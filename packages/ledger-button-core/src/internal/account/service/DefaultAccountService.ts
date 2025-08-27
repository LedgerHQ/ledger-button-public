import { type Factory, inject, injectable } from "inversify";
import { Either, EitherAsync } from "purify-ts";

import { dAppConfigModuleTypes } from "../../dAppConfig/dAppConfigModuleTypes.js";
import { type DAppConfigService } from "../../dAppConfig/DAppConfigService.js";
import { DAppConfig } from "../../dAppConfig/types.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import { type StorageService } from "../../storage/StorageService.js";
import { AccountServiceError } from "../model/error.js";
import { Account, AccountService, CloudSyncData } from "./AccountService.js";

@injectable()
export class DefaultAccountService implements AccountService {
  private readonly logger: LoggerPublisher;
  accounts: Account[] = [];
  selectedAccount: Account | null = null;
  supportedBlockchains: EitherAsync<
    Error,
    Map<string, DAppConfig["supportedBlockchains"][number]>
  >;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(dAppConfigModuleTypes.DAppConfigService)
    dAppConfigService: DAppConfigService,
  ) {
    this.logger = this.loggerFactory("[Account Service]");
    this.supportedBlockchains = dAppConfigService
      .get("supportedBlockchains")
      .map(
        (chains) => new Map(chains.map((chain) => [chain.currency_id, chain])),
      );
  }

  async setAccountsFromCloudSyncData(
    cloudsyncData: CloudSyncData,
  ): Promise<void> {
    const mappedAccounts = await this.mapCloudSyncDataToAccounts(cloudsyncData);

    this.setAccounts(mappedAccounts);
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

  private setAccounts(accounts: Either<AccountServiceError, Account[]>) {
    accounts
      .ifRight((accounts) => {
        this.accounts = accounts;
        this.logger.debug("saving accounts", { accounts: this.accounts });
      })
      .ifLeft((error) => {
        this.logger.error("error saving accounts", { error });
        this.accounts = [];
      });
  }

  private mapCloudSyncDataToAccounts(
    cloudSyncData: CloudSyncData,
  ): EitherAsync<AccountServiceError, Account[]> {
    const { accounts, accountNames } = cloudSyncData;
    return this.supportedBlockchains.map((supportedBlockchains) =>
      accounts.flatMap((account) => {
        const blockchain = supportedBlockchains.get(account.currencyId);
        const ticker = blockchain?.currency_ticker;
        const name = accountNames[account.id] ?? account.id;
        return ticker ? { ...account, name, ticker } : [];
      }),
    );
  }
}
