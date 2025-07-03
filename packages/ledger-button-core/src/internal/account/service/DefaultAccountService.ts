import { type Factory, inject, injectable } from "inversify";
import { Either, Left } from "purify-ts";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { AccountServiceError, FetchAccountsError } from "../model/error.js";
import { Account, AccountService } from "./AccountService.js";

@injectable()
export class DefaultAccountService implements AccountService {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = this.loggerFactory("[Account Service]");
  }

  async fetchAccounts(): Promise<Either<AccountServiceError, Account[]>> {
    this.logger.debug("Fetching accounts");
    return Left(new FetchAccountsError("Not implemented"));
  }
}
