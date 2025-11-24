import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storageModuleTypes.js";
import type { StorageService } from "../../StorageService.js";
import type { KeyPairMigrationService } from "./KeypairMigrationService.js";

@injectable()
export class MigrateDbUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(storageModuleTypes.KeyPairMigrationService)
    private readonly keyPairMigrationService: KeyPairMigrationService,
  ) {
    this.logger = this.loggerFactory("[MigrateDatabase Use Case]");
  }

  async execute(): Promise<void> {
    const startedVersion = this.storageService.getDbVersion();
    let version = startedVersion;

    if (version === 0) {
      await this.migrateToV1();
      version = 1;
    }

    this.logger.info(
      `Database migrated from version ${startedVersion} to version ${version}`,
    );
  }

  /**
   * During the first iteration of the app, the keyPair wasn't encrypted.
   * After a dungeon review it was decided to encrypt the keyPair.
   */
  private async migrateToV1(): Promise<void> {
    const keyPairResult = await this.storageService.getKeyPair();

    await this.keyPairMigrationService.migrateKeyPairToEncrypted(keyPairResult);

    this.storageService.setDbVersion(1);
    this.logger.info("Database migrated to version 1");
  }
}
