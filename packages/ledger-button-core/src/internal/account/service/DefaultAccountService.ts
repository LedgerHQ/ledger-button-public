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

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(accountModuleTypes.RemoteAccountDataSource)
    private readonly remoteAccountDataSource: RemoteAccountDataSource,
  ) {
    this.logger = this.loggerFactory("[Account Service]");
  }

  private setAccounts(accounts: Either<AccountServiceError, Account[]>) {
    if (accounts.isRight()) {
      this.accounts = accounts.extract();
      this.logger.debug("saving accounts", { accounts: this.accounts });
    }
  }

  async fetchAccounts(): Promise<Either<AccountServiceError, Account[]>> {
    this.logger.debug("fetching accounts");
    const cloudSyncData = await this.remoteAccountDataSource.fetchAccounts();
    this.logger.debug("fetched cloud sync data", { cloudSyncData });
    const accounts = cloudSyncData.chain(this.mapCloudSyncDataToAccounts);
    this.logger.debug("mapped cloud sync data to accounts", { accounts });

    this.setAccounts(accounts);

    return accounts;
  }

  getAccounts(): Account[] {
    return this.accounts;
  }

  mapCloudSyncDataToAccounts(
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
