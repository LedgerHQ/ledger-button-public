import { type Factory, inject, injectable } from "inversify";

import { DEFAULT_BLOCKCHAIN_FAMILY } from "@api/model/ButtonCoreContext";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { storageModuleTypes } from "../di/storageModuleTypes";
import type { AccountDbModel } from "../model/accountDbModel";
import { STORAGE_KEYS } from "../model/constant";
import type { StorageService } from "../StorageService";
import type { KeyPairMigrationService } from "./KeypairMigrationService";

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
    this.logger = this.loggerFactory("MigrateDatabase Use Case");
  }

  async execute(): Promise<void> {
    const startedVersion = await this.storageService.getDbVersion();
    let version = startedVersion;

    if (version === 0) {
      await this.migrateToV1();
      version = 1;
    }

    if (version === 1) {
      await this.migrateToV2();
      version = 2;
    }

    if (version === 2) {
      await this.migrateToV3();
      version = 3;
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

    const setVersionResult = await this.storageService.setDbVersion(1);
    if (setVersionResult.isLeft()) {
      this.logger.error(
        "Failed to store DB version to already migrated database",
        {
          error: setVersionResult.extract(),
        },
      );
      throw new Error(
        "Failed to store DB version to already migrated database",
      );
    }
    this.logger.info("Database migrated to version 1");
  }

  /**
   * Migrates the database version storage from localStorage to IndexedDB.
   * This ensures the version is stored in a more persistent and reliable storage.
   */
  private async migrateToV2(): Promise<void> {
    const setVersionResult = await this.storageService.setDbVersion(2);

    if (setVersionResult.isLeft()) {
      this.logger.error("Failed to store DB version in IndexedDB", {
        error: setVersionResult.extract(),
      });
      throw new Error("Failed to migrate DB version to IndexedDB");
    }

    this.storageService.removeItem(STORAGE_KEYS.DB_VERSION);
    this.logger.info("Database migrated to version 2");
  }

  /**
   * The selected account became per blockchain family. Move the legacy single
   * selected-account entry into the new per-family record under the default
   * family, then drop the legacy key.
   */
  private async migrateToV3(): Promise<void> {
    this.storageService
      .getItem<AccountDbModel>(STORAGE_KEYS.SELECTED_ACCOUNT)
      .ifJust((accountDbModel) => {
        const accounts = this.storageService
          .getItem<Record<string, AccountDbModel>>(
            STORAGE_KEYS.SELECTED_ACCOUNTS,
          )
          .orDefault({});
        if (!(DEFAULT_BLOCKCHAIN_FAMILY in accounts)) {
          accounts[DEFAULT_BLOCKCHAIN_FAMILY] = accountDbModel;
          this.storageService.saveItem(STORAGE_KEYS.SELECTED_ACCOUNTS, accounts);
        }
      });

    this.storageService.removeItem(STORAGE_KEYS.SELECTED_ACCOUNT);

    const setVersionResult = await this.storageService.setDbVersion(3);
    if (setVersionResult.isLeft()) {
      this.logger.error(
        "Failed to store DB version to already migrated database",
        {
          error: setVersionResult.extract(),
        },
      );
      throw new Error(
        "Failed to store DB version to already migrated database",
      );
    }
    this.logger.info("Database migrated to version 3");
  }
}
