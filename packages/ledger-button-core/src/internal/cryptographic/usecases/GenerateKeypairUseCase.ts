import {
  Curve,
  KeyPair,
  NobleCryptoService,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";

@injectable()
export class GenerateKeypairUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("GenerateKeypairUseCase");
  }

  async execute(): Promise<KeyPair> {
    this.logger.info("Generating new keypair...");
    const cryptoService = new NobleCryptoService();
    const keypair: KeyPair = await cryptoService.createKeyPair(Curve.K256);

    if (!keypair) {
      throw new Error("Invalid keypair");
    }

    this.logger.info("Keypair public key", {
      keypair: keypair.getPublicKeyToHex(),
    });

    return keypair;
  }
}
