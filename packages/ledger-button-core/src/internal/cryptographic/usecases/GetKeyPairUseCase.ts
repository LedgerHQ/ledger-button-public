import { bufferToHexaString } from "@ledgerhq/device-management-kit";
import {
  Curve,
  KeyPair,
  NobleCryptoService,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { storageModuleTypes } from "../../storage/storageModuleTypes.js";
import type { StorageService } from "../../storage/StorageService.js";
import { cryptographicModuleTypes } from "../cryptographicModuleTypes.js";
import { DecryptKeyPairUseCase } from "./DecryptKeyPairUseCase.js";
import { EncryptKeyPairUseCase } from "./EncryptKeyPairUseCase.js";
import { GenerateKeyPairUseCase } from "./GenerateKeyPairUseCase.js";
import { GetEncryptionKeyUseCase } from "./GetEncryptionKey.js";

@injectable()
export class GetKeyPairUseCase {
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
    this.logger = loggerFactory("GetKeyPairUseCase");
  }

  async execute(): Promise<KeyPair> {
    this.logger.info("Start Getting/Creating keyPair");
    let keyPair: KeyPair | undefined;
    const keyPairResult = await this.storageService.getKeyPair();
    if (keyPairResult.isRight()) {
      this.logger.info("KeyPair found in storage, decrypting");
      const encryptedKeyPair = keyPairResult.extract();
      const decryptionKey = await this.getEncryptionKeyUseCase.execute();

      this.logger.debug("Decrypting keyPair with pub key", {
        encryptedKeyPair: bufferToHexaString(encryptedKeyPair),
      });

      const decryptedKeyPair = await this.decryptKeyPairUseCase.execute(
        encryptedKeyPair,
        decryptionKey,
      );

      this.logger.debug("Decrypted keyPair", {
        decryptedKeyPair: bufferToHexaString(decryptedKeyPair),
      });

      const cryptoService = new NobleCryptoService();
      keyPair = cryptoService.importKeyPair(decryptedKeyPair, Curve.K256);
    } else {
      this.logger.info("KeyPair not found in storage, generating new one");
      keyPair = await this.generateKeyPairUseCase.execute();
      this.logger.info("New keyPair generated", {
        keyPair: keyPair.getPublicKeyToHex(),
      });

      const encryptionKey = await this.getEncryptionKeyUseCase.execute();
      const encryptedKeyPair = await this.encryptKeyPairUseCase.execute(
        keyPair,
        encryptionKey,
      );

      this.logger.info("Storing encrypted keyPair in storage", {
        encryptedKeyPair: bufferToHexaString(encryptedKeyPair),
      });

      await this.storageService.storeKeyPair(encryptedKeyPair);
    }

    this.logger.info("KeyPair retrieved with public key", {
      keyPair: keyPair.getPublicKeyToHex(),
    });

    return keyPair;
  }
}
