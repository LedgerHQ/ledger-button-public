import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import { type SignedTransaction } from "./SignRawTransaction.js";
import {
  SignTransaction,
  type SignTransactionParams,
} from "./SignTransaction.js";

@injectable()
export class SendTransaction {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.SignTransactionUseCase)
    private readonly signTransaction: SignTransaction,
  ) {
    this.logger = loggerFactory("[SendTransaction]");
  }

  async execute(params: SignTransactionParams): Promise<SignedTransaction> {
    const signedTransaction = await this.signTransaction.execute(params);
    this.logger.debug("signedTransaction", { signedTransaction });

    // TODO: Broadcast the transaction
    this.logger.debug("Broadcasting transaction... (not implemented yet)", {
      signedTransaction,
    });

    return signedTransaction;
  }
}
