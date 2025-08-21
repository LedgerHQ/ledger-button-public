import { type Factory, inject, injectable } from "inversify";
import { Either, Right } from "purify-ts";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import { type RemoteAccountDataSource } from "../datasource/RemoteAccountDataSource.js";
import { AccountServiceError } from "../model/error.js";
import { Account, AccountService, CloudSyncData } from "./AccountService.js";

@injectable()
export class DefaultAccountService implements AccountService {
  private readonly logger: LoggerPublisher;
  accounts: Account[] = [];
  selectedAccount: Account | null = null;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(accountModuleTypes.RemoteAccountDataSource)
    private readonly remoteAccountDataSource: RemoteAccountDataSource,
  ) {
    this.logger = this.loggerFactory("[Account Service]");
  }

  setAccountsFromCloudSyncData(cloudsyncData: CloudSyncData): void {
    const mappedAccounts = this.mapCloudSyncDataToAccounts(cloudsyncData);

    // TODO filter accounts in function of the dApp supported currencies config

    this.setAccounts(mappedAccounts);
  }

  selectAccount(address: string): void {
    const found = this.accounts.find(
      (account) => account.freshAddress === address,
    );

    if (found) {
      this.selectedAccount = found;
      this.logger.info("Account selected", { account: found });
      //TODO persist the selected account in the storage
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
  ): Either<AccountServiceError, Account[]> {
    const { accounts, accountNames } = cloudSyncData;
    return Right(
      accounts.map((account) => ({
        ...account,
        name: accountNames[account.id],
      })),
    );
  }
}
