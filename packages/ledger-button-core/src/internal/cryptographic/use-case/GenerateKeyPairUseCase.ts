import {
  Curve,
  KeyPair,
  NobleCryptoService,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes.js";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher.js";

@injectable()
export class GenerateKeyPairUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("GenerateKeyPairUseCase");
  }

  async execute(): Promise<KeyPair> {
    this.logger.info("Generating new keyPair...");
    const cryptoService = new NobleCryptoService();
    const keyPair: KeyPair = await cryptoService.createKeyPair(Curve.K256);

    if (!keyPair) {
      throw new Error("Invalid keyPair");
    }

    this.logger.info("KeyPair public key", {
      keyPair: keyPair.getPublicKeyToHex(),
    });

    return keyPair;
  }
}
