import { type Factory, inject, injectable } from "inversify";
import { Observable, of } from "rxjs";

import { SignTransactionParams } from "../../../api/model/signing/SignTransactionParams.js";
import { SignedTransactionResult } from "../../../api/model/signing/SignTransactionResult.js";
import { getRawTransactionFromEipTransaction } from "../../../internal/transaction/utils/TransactionHelper.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import { SignTransactionError } from "../model/errors.js";
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

  execute(params: SignTransactionParams): Observable<SignedTransactionResult> {
    this.logger.info("Starting transaction signing", { params });

    const transaction = params.transaction;
    this.logger.debug("transaction", { transaction });
    try {
      const rawTransaction = getRawTransactionFromEipTransaction(transaction);
      return this.signRawTransaction.execute({
        rawTransaction: rawTransaction,
        broadcast: true,
      });
    } catch (error) {
      this.logger.error("Failed to parse transaction", { error });
      return of({
        status: "error",
        error: new SignTransactionError("Failed to parse transaction", {
          error,
        }),
      });
    }
  }
}
