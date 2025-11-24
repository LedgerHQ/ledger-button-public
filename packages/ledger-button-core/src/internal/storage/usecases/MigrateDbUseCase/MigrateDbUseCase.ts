import { type Factory, inject, injectable } from "inversify";

import { cryptographicModuleTypes } from "../../../cryptographic/cryptographicModuleTypes.js";
import type { EncryptKeypairUseCase } from "../../../cryptographic/usecases/EncryptKeypairUseCase.js";
import type { GetEncryptionKeyUseCase } from "../../../cryptographic/usecases/GetEncryptionKey.js";
import type { GetKeypairUseCase } from "../../../cryptographic/usecases/GetKeypairUseCase.js";
import { loggerModuleTypes } from "../../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storageModuleTypes.js";
import type { StorageService } from "../../StorageService.js";
import { KeyPairMigrationService } from "./KeypairMigrationService.js";

@injectable()
export class MigrateDbUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(cryptographicModuleTypes.EncryptKeypairUseCase)
    private readonly encryptKeypairUseCase: EncryptKeypairUseCase,
    @inject(cryptographicModuleTypes.GetEncryptionKeyUseCase)
    private readonly getEncryptionKeyUseCase: GetEncryptionKeyUseCase,
    @inject(cryptographicModuleTypes.GetKeypairUseCase)
    private readonly getKeypairUseCase: GetKeypairUseCase, // Todo rename generate keypair use case
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

    const keyPairMigrationService = new KeyPairMigrationService(
      this.logger,
      this.storageService,
      this.encryptKeypairUseCase,
      this.getEncryptionKeyUseCase,
      this.getKeypairUseCase,
    );

    await keyPairMigrationService.migrateKeyPairToEncrypted(keyPairResult);

    this.storageService.setDbVersion(1);
    this.logger.info("Database migrated to version 1");
  }
}

