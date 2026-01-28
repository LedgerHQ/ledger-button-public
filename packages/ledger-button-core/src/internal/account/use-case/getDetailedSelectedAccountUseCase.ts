import type { Factory } from "inversify";
import { inject, injectable } from "inversify";

import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import type { ContextService } from "../../context/ContextService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import type { Account } from "../service/AccountService.js";
import type { FetchSelectedAccountUseCase } from "./fetchSelectedAccountUseCase.js";

@injectable()
export class GetDetailedSelectedAccountUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(accountModuleTypes.FetchSelectedAccountUseCase)
    private readonly fetchSelectedAccountUseCase: FetchSelectedAccountUseCase,
  ) {
    this.logger = loggerFactory("GetDetailedSelectedAccountUseCase");
  }

  async execute(): Promise<Account | undefined> {
    const selectedAccount = this.contextService.getContext().selectedAccount;

    if (this.isSelectedAccountHydrated(selectedAccount)) {
      this.logger.debug("Selected account already hydrated", {
        selectedAccount,
      });
      return selectedAccount as Account;
    }

    return this.fetchSelectedAccountUseCase.execute();
  }

  private isSelectedAccountHydrated(selectedAccount?: Account): boolean {
    return !!selectedAccount?.name && selectedAccount.name.length > 0;
  }
}
