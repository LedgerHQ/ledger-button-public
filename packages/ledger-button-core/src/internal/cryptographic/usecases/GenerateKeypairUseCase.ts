import {
  bufferToHexaString,
  hexaStringToBuffer,
} from "@ledgerhq/device-management-kit";
import {
  Keypair,
  KeypairFromBytes,
} from "@ledgerhq/device-trusted-app-kit-ledger-keyring-protocol";
import { Factory, inject, injectable } from "inversify";

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

  execute(): Keypair {
    this.logger.info("Generating new keypair...");
    //TODO: Remove this and generate keypair
    const keypair = hexaStringToBuffer(
      "0x4b6e1260242431b90e37c806384b67dafba634d426aa15f99662f60320109462",
    );

    if (!keypair) {
      throw new Error("Invalid keypair");
    }

    this.logger.info("Keypair private key", {
      keypair: bufferToHexaString(keypair),
    });

    const newKeypair = new KeypairFromBytes(keypair);

    this.logger.info("New keypair", {
      keypaiPub: newKeypair.pubKeyToHex(),
    });

    return newKeypair;
  }
}
