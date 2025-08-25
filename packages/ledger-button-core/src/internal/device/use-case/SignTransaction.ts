import { ethers } from "ethers";
import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
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

  async execute(params: object[]): Promise<SignedTransaction> {
    this.logger.info("Starting transaction signing", { params });

    const transaction = params[0];
    console.log("transaction", transaction);
    try {
      const etherTx = ethers.Transaction.from(transaction);
      console.log("etherstx", etherTx);
      const tx = etherTx.unsignedSerialized;
      console.log("rawtx", tx);
      return this.signRawTransaction.execute({
        rawTransaction: tx,
      });
    } catch (error) {
      this.logger.error("Failed to parse transaction", { error });
      throw new Error("Failed to parse transaction");
    }
  }
}
