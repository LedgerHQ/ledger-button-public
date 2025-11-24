import {
  Curve,
  NobleCryptoService,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";

import type { EncryptKeypairUseCase } from "../../../cryptographic/usecases/EncryptKeypairUseCase.js";
import type { GetEncryptionKeyUseCase } from "../../../cryptographic/usecases/GetEncryptionKey.js";
import type { GetOrCreateKeyPairUseCase } from "../../../cryptographic/usecases/GetOrCreateKeyPairUseCase.js";
import type { LoggerPublisher } from "../../../logger/service/LoggerPublisher.js";
import type { StorageService } from "../../StorageService.js";

export class KeyPairMigrationService {
  constructor(
    private readonly logger: LoggerPublisher,
    private readonly storageService: StorageService,
    private readonly encryptKeyPairUseCase: EncryptKeypairUseCase,
    private readonly getEncryptionKeyUseCase: GetEncryptionKeyUseCase,
    private readonly getOrCreateKeyPairUseCase: GetOrCreateKeyPairUseCase,
  ) {}

  async migrateKeyPairToEncrypted(
    keyPairResult: Awaited<ReturnType<StorageService["getKeyPair"]>>,
  ): Promise<void> {
    try {
      if (keyPairResult.isRight()) {
        const keyPairBuffer = keyPairResult.extract();

        await this.encryptExistingKeyPair(keyPairBuffer);
      } else {
        await this.generateNewKeyPair();
      }
    } catch (error) {
      this.logger.error("Error migrating database to version 1", { error });
      await this.storageService.removeKeyPair();
      await this.generateNewKeyPair();
    }
  }

  private async encryptExistingKeyPair(
    keyPairBuffer: Uint8Array,
  ): Promise<void> {
    this.logger.info("KeyPair found in storage, need to encrypt it");
    const cryptoService = new NobleCryptoService();
    const keyPair = cryptoService.importKeyPair(keyPairBuffer, Curve.K256);

    const encryptionKey = await this.getEncryptionKeyUseCase.execute();
    const encryptedKeyPair = await this.encryptKeyPairUseCase.execute(
      keyPair,
      encryptionKey,
    );

    await this.storageService.removeKeyPair();
    await this.storageService.storeKeyPair(encryptedKeyPair);
  }

  private async generateNewKeyPair(): Promise<void> {
    await this.getOrCreateKeyPairUseCase.execute();
  }
}
