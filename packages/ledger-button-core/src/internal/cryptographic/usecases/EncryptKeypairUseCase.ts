import {
  bufferToHexaString,
  hexaStringToBuffer,
} from "@ledgerhq/device-management-kit";
import { KeyPair } from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";

@injectable()
export class EncryptKeypairUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = this.loggerFactory("[Encrypt Keypair Use Case]");
  }

  async execute(
    keypair: KeyPair,
    encryptionKey: CryptoKey,
  ): Promise<Uint8Array> {
    // Encrypt the keypair's private key using Web Crypto API with a previously imported/exported WebCrypto key
    if (!window || !window.crypto || !window.crypto.subtle) {
      this.logger.error("Web Crypto API is not available in the environment");
      throw new Error("Web Crypto API is not available");
    }
    this.logger.info("Encrypting keypair with pub key", {
      keypair: keypair.getPublicKeyToHex(),
    });

    // Convert the private key to Uint8Array (assuming it's a Buffer, ArrayBuffer, or hex string)
    const keypairIdHex = keypair.id;
    const privateKeyBytes = hexaStringToBuffer(keypairIdHex);

    //Should never happen, but just in case
    if (privateKeyBytes === null) {
      this.logger.error("Private key bytes are null");
      throw new Error("Can't encrypt keypair");
    }
    // AES-GCM requires a random 12-byte IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      encryptionKey,
      new Uint8Array(privateKeyBytes),
    );

    // Prepend IV to the ciphertext for later decryption
    const result = new Uint8Array(iv.length + ciphertext.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(ciphertext), iv.length);

    console.log("ciphertext", bufferToHexaString(new Uint8Array(ciphertext)));

    this.logger.info("Keypair encrypted", {
      encryptedKeypair: bufferToHexaString(result),
    });

    return result;
  }
}
