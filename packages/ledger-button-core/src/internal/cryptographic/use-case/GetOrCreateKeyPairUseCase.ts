import { bufferToHexaString } from "@ledgerhq/device-management-kit";
import {
  Curve,
  KeyPair,
  NobleCryptoService,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";
import { storageModuleTypes } from "@internal/storage/di/storageModuleTypes";
import type { StorageService } from "@internal/storage/StorageService";

import { cryptographicModuleTypes } from "../di/cryptographicModuleTypes";
import { DecryptKeyPairUseCase } from "./DecryptKeyPairUseCase";
import { EncryptKeyPairUseCase } from "./EncryptKeyPairUseCase";
import { GenerateKeyPairUseCase } from "./GenerateKeyPairUseCase";
import { GetEncryptionKeyUseCase } from "./GetEncryptionKey";

@injectable()
export class GetOrCreateKeyPairUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(cryptographicModuleTypes.GenerateKeyPairUseCase)
    private readonly generateKeyPairUseCase: GenerateKeyPairUseCase,
    @inject(cryptographicModuleTypes.GetEncryptionKeyUseCase)
    private readonly getEncryptionKeyUseCase: GetEncryptionKeyUseCase,
    @inject(cryptographicModuleTypes.EncryptKeyPairUseCase)
    private readonly encryptKeyPairUseCase: EncryptKeyPairUseCase,
    @inject(cryptographicModuleTypes.DecryptKeyPairUseCase)
    private readonly decryptKeyPairUseCase: DecryptKeyPairUseCase,
  ) {
    this.logger = loggerFactory("GetOrCreateKeyPairUseCase");
  }

  async execute(): Promise<KeyPair> {
    this.logger.info("Start Getting/Creating keypair");
    let keypair: KeyPair | undefined;
    const keypairResult = await this.storageService.getKeyPair();
    if (keypairResult.isRight()) {
      this.logger.info("KeyPair found in storage, decrypting");
      const encryptedKeyPair = keypairResult.extract();
      const decryptionKey = await this.getEncryptionKeyUseCase.execute();

      this.logger.debug("Decrypting keypair with pub key", {
        encryptedKeyPair: bufferToHexaString(encryptedKeyPair),
      });

      const decryptedKeyPair = await this.decryptKeyPairUseCase.execute(
        encryptedKeyPair,
        decryptionKey,
      );

      this.logger.debug("Decrypted keypair", {
        decryptedKeyPair: bufferToHexaString(decryptedKeyPair),
      });

      const cryptoService = new NobleCryptoService();
      keypair = cryptoService.importKeyPair(decryptedKeyPair, Curve.K256);
    } else {
      this.logger.info("KeyPair not found in storage, generating new one");
      keypair = await this.generateKeyPairUseCase.execute();
      this.logger.info("New keypair generated", {
        keypair: keypair.getPublicKeyToHex(),
      });

      const encryptionKey = await this.getEncryptionKeyUseCase.execute();
      const encryptedKeyPair = await this.encryptKeyPairUseCase.execute(
        keypair,
        encryptionKey,
      );

      this.logger.info("Storing encrypted keypair in storage", {
        encryptedKeyPair: bufferToHexaString(encryptedKeyPair),
      });

      await this.storageService.storeKeyPair(encryptedKeyPair);
    }

    this.logger.info("KeyPair retrieved with public key", {
      keypair: keypair.getPublicKeyToHex(),
    });

    return keypair;
  }
}
