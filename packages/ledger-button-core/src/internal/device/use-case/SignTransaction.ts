import { type Factory, inject, injectable } from "inversify";
import { Observable, of } from "rxjs";

import { SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import { SignTransactionParams } from "../../../api/model/signing/SignTransactionParams.js";
import { getRawTransactionFromEipTransaction } from "../../../internal/transaction/utils/TransactionHelper.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import { SignRawTransaction } from "./SignRawTransaction.js";
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

  execute(params: SignTransactionParams): Observable<SignFlowStatus> {
    this.logger.info("Starting transaction signing", { params });
    const transaction = params.transaction;
    try {
      const rawTransaction = getRawTransactionFromEipTransaction(transaction);
      return this.signRawTransaction.execute({
        transaction: rawTransaction,
        broadcast: params.broadcast,
      });
    } catch (error) {
      this.logger.error("Failed to parse transaction", { error });
      return of({
        signType: "transaction",
        status: "error",
        error,
      });
    }
  }
}
