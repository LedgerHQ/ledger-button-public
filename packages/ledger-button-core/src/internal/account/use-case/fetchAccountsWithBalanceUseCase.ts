import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import type { AccountService } from "../service/AccountService.js";
import type { Account } from "../service/AccountService.js";
import { FetchAccountsUseCase } from "./fetchAccountsUseCase.js";

@injectable()
export class FetchAccountsWithBalanceUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(accountModuleTypes.FetchAccountsUseCase)
    private readonly fetchAccountsUseCase: FetchAccountsUseCase,
    @inject(accountModuleTypes.AccountService)
    private readonly accountService: AccountService,
  ) {
    this.logger = loggerFactory("FetchAccountsWithBalanceUseCase");
  }

  async execute(): Promise<Account[]> {
    await this.fetchAccountsUseCase.execute();
    await this.accountService.hydrateAccountsWithBalanceAndTokens();

    const accounts = this.accountService.getAccounts();
    this.logger.info("Accounts with balance", { accounts });
    return accounts;
  }
}
