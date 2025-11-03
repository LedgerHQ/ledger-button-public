import { bufferToHexaString } from "@ledgerhq/device-management-kit";
import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";

@injectable()
export class DecryptKeypairUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = this.loggerFactory("[Decrypt Keypair Use Case]");
  }

  async execute(
    encryptedKeypair: Uint8Array,
    decryptionKey: CryptoKey,
  ): Promise<Uint8Array> {
    this.logger.info("Decrypting keypair with decryption key", {
      encryptedKeypair: bufferToHexaString(encryptedKeypair),
    });

    const iv = encryptedKeypair.slice(0, 12);
    const ciphertext = encryptedKeypair.slice(12);
    const decryptedKeypair = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      decryptionKey,
      ciphertext,
    );

    return new Uint8Array(decryptedKeypair);
  }
}
