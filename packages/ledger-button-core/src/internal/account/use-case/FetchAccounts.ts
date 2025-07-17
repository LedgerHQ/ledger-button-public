import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import {
  type Account,
  type AccountService,
} from "../service/AccountService.js";

@injectable()
export class FetchAccounts {
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(accountModuleTypes.AccountService)
    private readonly accountService: AccountService,
  ) {
    this.logger = loggerFactory("[FetchAccounts UseCase]");
  }

  async execute(): Promise<Account[]> {
    this.logger.info("Fetching accounts");
    const res = await this.accountService.fetchAccounts();

    return res.caseOf({
      Left: (error) => {
        this.logger.error("Failed to fetch accounts", { error });
        throw error;
      },
      Right: (accounts) => accounts,
    });
  }
}
