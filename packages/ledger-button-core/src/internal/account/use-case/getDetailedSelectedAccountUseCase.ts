import type { Factory } from "inversify";
import { inject, injectable } from "inversify";
import { Either } from "purify-ts";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import type { DetailedAccount } from "../service/AccountService.js";
import {
  type AccountError,
  type FetchSelectedAccountUseCase,
} from "./fetchSelectedAccountUseCase.js";

@injectable()
export class GetDetailedSelectedAccountUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(accountModuleTypes.FetchSelectedAccountUseCase)
    private readonly fetchSelectedAccountUseCase: FetchSelectedAccountUseCase,
  ) {
    this.logger = loggerFactory("GetDetailedSelectedAccountUseCase");
  }

  async execute(): Promise<Either<AccountError, DetailedAccount>> {
    this.logger.debug("Fetching detailed selected account");
    return this.fetchSelectedAccountUseCase.execute();
  }
}
