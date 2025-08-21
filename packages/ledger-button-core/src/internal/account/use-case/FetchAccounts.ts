import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import { type AccountService } from "../service/AccountService.js";

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

  async execute() {
    const accounts = await this.accountService.fetchAccounts();
    accounts.caseOf({
      Right: (accounts) => {
        this.logger.debug("Accounts fetched", { accounts });
        return accounts;
      },
      Left: (error) => {
        this.logger.error("Failed to fetch accounts", { error });
        throw error;
      },
    });
  }
}
