import {
  Curve,
  NobleCryptoService,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { type Factory, inject, injectable } from "inversify";

import { cryptographicModuleTypes } from "../../cryptographic/cryptographicModuleTypes.js";
import type { EncryptKeyPairUseCase } from "../../cryptographic/usecases/EncryptKeyPairUseCase.js";
import type { GetEncryptionKeyUseCase } from "../../cryptographic/usecases/GetEncryptionKey.js";
import type { GetKeyPairUseCase } from "../../cryptographic/usecases/GetKeyPairUseCase.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../storageModuleTypes.js";
import type { StorageService } from "../StorageService.js";

@injectable()
export class MigrateDbUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(cryptographicModuleTypes.EncryptKeyPairUseCase)
    private readonly encryptKeyPairUseCase: EncryptKeyPairUseCase,
    @inject(cryptographicModuleTypes.GetEncryptionKeyUseCase)
    private readonly getEncryptionKeyUseCase: GetEncryptionKeyUseCase,
    @inject(cryptographicModuleTypes.GetKeyPairUseCase)
    private readonly getKeyPairUseCase: GetKeyPairUseCase,
  ) {
    this.logger = this.loggerFactory("[MigrateDatabase Use Case]");
  }

  async execute(): Promise<void> {
    const startedVersion = await this.storageService.getDbVersion();
    let version = startedVersion;
    if (version === 0) {
      await this.migrateToV1();
      version = 1;
    }
    //PUT here future migrations

    this.logger.info(
      `Database migrated from version ${startedVersion} to version ${version}`,
    );
  }

  private async migrateToV1(): Promise<void> {
    const keyPairResult = await this.storageService.getKeyPair();

    if (keyPairResult.isRight()) {
      this.logger.info("KeyPair found in storage, need to encrypt it");
      const keyPairBuffer = keyPairResult.extract();
      const cryptoService = new NobleCryptoService();
      const keyPair = cryptoService.importKeyPair(keyPairBuffer, Curve.K256);

      const encryptionKey = await this.getEncryptionKeyUseCase.execute();
      const encryptedKeyPair = await this.encryptKeyPairUseCase.execute(
        keyPair,
        encryptionKey,
      );

      await this.storageService.removeKeyPair();
      await this.storageService.storeKeyPair(encryptedKeyPair);
    } else {
      //No keyPair found, generate a new one
      await this.getKeyPairUseCase.execute();
    }

    await this.storageService.setDbVersion(1);
    this.logger.info("Database migrated to version 1");
  }
}
