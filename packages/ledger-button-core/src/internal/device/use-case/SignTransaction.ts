import { ethers } from "ethers";
import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import { SignTransactionError } from "../model/errors.js";
import {
  type SignedTransaction,
  SignRawTransaction,
} from "./SignRawTransaction.js";

export interface SignTransactionParams {
  transaction: object;
}

@injectable()
export class SignTransaction {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.SignRawTransactionUseCase)
    private readonly signRawTransaction: SignRawTransaction,
  ) {
    this.logger = loggerFactory("[SignTransaction]");
  }

  async execute(params: SignTransactionParams): Promise<SignedTransaction> {
    this.logger.info("Starting transaction signing", { params });

    const transaction = params.transaction;
    this.logger.debug("transaction", { transaction });
    try {
      const etherTx = ethers.Transaction.from(transaction);
      this.logger.debug("etherstx", { etherTx });
      const tx = etherTx.unsignedSerialized;
      this.logger.debug("rawtx", { tx });
      return this.signRawTransaction.execute({
        rawTransaction: tx,
      });
    } catch (error) {
      this.logger.error("Failed to parse transaction", { error });
      throw new SignTransactionError("Failed to parse transaction", { error });
    }
  }
}
