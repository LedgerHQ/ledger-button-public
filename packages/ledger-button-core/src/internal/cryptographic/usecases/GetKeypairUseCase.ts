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
import { DecryptKeypairUseCase } from "./DecryptKeypairUseCase.js";
import { EncryptKeypairUseCase } from "./EncryptKeypairUseCase.js";
import { GenerateKeypairUseCase } from "./GenerateKeypairUseCase.js";
import { GetEncryptionKeyUseCase } from "./GetEncryptionKey.js";

@injectable()
export class GetKeypairUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(storageModuleTypes.StorageService)
    private readonly storageService: StorageService,
    @inject(cryptographicModuleTypes.GenerateKeypairUseCase)
    private readonly generateKeypairUseCase: GenerateKeypairUseCase,
    @inject(cryptographicModuleTypes.GetEncryptionKeyUseCase)
    private readonly getEncryptionKeyUseCase: GetEncryptionKeyUseCase,
    @inject(cryptographicModuleTypes.EncryptKeypairUseCase)
    private readonly encryptKeypairUseCase: EncryptKeypairUseCase,
    @inject(cryptographicModuleTypes.DecryptKeypairUseCase)
    private readonly decryptKeypairUseCase: DecryptKeypairUseCase,
  ) {
    this.logger = loggerFactory("GetKeypairUseCase");
  }

  async execute(): Promise<KeyPair> {
    this.logger.info("Start Getting/Creating keypair");
    let keypair: KeyPair | undefined;
    const keypairResult = await this.storageService.getKeyPair();
    if (keypairResult.isRight()) {
      this.logger.info("Keypair found in storage, decrypting");
      const encryptedKeypair = keypairResult.extract();
      const decryptionKey = await this.getEncryptionKeyUseCase.execute();

      this.logger.debug("Decrypting keypair with pub key", {
        encryptedKeypair: bufferToHexaString(encryptedKeypair),
      });

      const decryptedKeypair = await this.decryptKeypairUseCase.execute(
        encryptedKeypair,
        decryptionKey,
      );

      this.logger.debug("Decrypted keypair", {
        decryptedKeypair: bufferToHexaString(decryptedKeypair),
      });

      const cryptoService = new NobleCryptoService();
      keypair = cryptoService.importKeyPair(decryptedKeypair, Curve.K256);
    } else {
      this.logger.info("Keypair not found in storage, generating new one");
      keypair = await this.generateKeypairUseCase.execute();
      this.logger.info("New keypair generated", {
        keypair: keypair.getPublicKeyToHex(),
      });

      const encryptionKey = await this.getEncryptionKeyUseCase.execute();
      const encryptedKeypair = await this.encryptKeypairUseCase.execute(
        keypair,
        encryptionKey,
      );

      this.logger.info("Storing encrypted keypair in storage", {
        encryptedKeypair: bufferToHexaString(encryptedKeypair),
      });

      await this.storageService.storeKeyPair(encryptedKeypair);
    }

    this.logger.info("Keypair retrieved with public key", {
      keypair: keypair.getPublicKeyToHex(),
    });

    return keypair;
  }
}
