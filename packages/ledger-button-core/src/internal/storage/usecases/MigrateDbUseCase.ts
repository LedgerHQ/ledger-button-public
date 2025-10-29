import {
  Curve,
  NobleCryptoService,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { type Factory, inject, injectable } from "inversify";

import { cryptographicModuleTypes } from "../../cryptographic/cryptographicModuleTypes.js";
import type { EncryptKeypairUseCase } from "../../cryptographic/usecases/EncryptKeypairUseCase.js";
import type { GetEncryptionKeyUseCase } from "../../cryptographic/usecases/GetEncryptionKey.js";
import type { GetKeypairUseCase } from "../../cryptographic/usecases/GetKeypairUseCase.js";
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
    @inject(cryptographicModuleTypes.EncryptKeypairUseCase)
    private readonly encryptKeypairUseCase: EncryptKeypairUseCase,
    @inject(cryptographicModuleTypes.GetEncryptionKeyUseCase)
    private readonly getEncryptionKeyUseCase: GetEncryptionKeyUseCase,
    @inject(cryptographicModuleTypes.GetKeypairUseCase)
    private readonly getKeypairUseCase: GetKeypairUseCase,
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
    const keypairResult = await this.storageService.getKeyPair();

    if (keypairResult.isRight()) {
      this.logger.info("Keypair found in storage, need to encrypt it");
      const keypairBuffer = keypairResult.extract();
      const cryptoService = new NobleCryptoService();
      const keypair = cryptoService.importKeyPair(
        keypairBuffer as Uint8Array,
        Curve.K256,
      );

      const encryptionKey = await this.getEncryptionKeyUseCase.execute();
      const encryptedKeypair = await this.encryptKeypairUseCase.execute(
        keypair,
        encryptionKey,
      );

      await this.storageService.storeKeyPair(encryptedKeypair);
    } else {
      //No keypair found, generate a new one
      await this.getKeypairUseCase.execute();
    }

    await this.storageService.setDbVersion(1);
    this.logger.info("Database migrated to version 1");
  }
}
