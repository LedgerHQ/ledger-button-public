import { type Factory, inject, injectable } from "inversify";
import { Either } from "purify-ts";
import { loggerModuleTypes } from "src/internal/logger/loggerModuleTypes.js";
import { LoggerPublisher } from "src/internal/logger/service/LoggerPublisher.js";

// import { storageModuleTypes } from "src/internal/storage/storageModuleTypes.js";
// import { type StorageService } from "src/internal/storage/StorageService.js";
import { Account } from "../service/AccountService.js";
import { LocalAccountDataSource } from "./LocalAccountDataSource.js";

@injectable()
export class DefaultLocalAccountDataSource implements LocalAccountDataSource {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    // @inject(storageModuleTypes.StorageService)
    // private readonly storageService: StorageService,
  ) {
    this.logger = this.loggerFactory("[Account Service]");
  }

  fetchAccounts(): Promise<Either<Error, Account[]>> {
    this.logger.debug("Method not implemented.");
    throw new Error("Method not implemented.");
  }
}
