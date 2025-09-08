import { inject, injectable } from "inversify";
import { Observable } from "rxjs";

import { SignFlowStatus } from "../../../api/model/signing/SignFlowStatus.js";
import { type SignRawTransactionParams } from "../../../api/model/signing/SignRawTransactionParams.js";
import { SignTransactionParams } from "../../../api/model/signing/SignTransactionParams.js";
import { SignTypedMessageParams } from "../../../api/model/signing/SignTypedMessageParams.js";
import { SignRawTransaction } from "../../../internal/device/use-case/SignRawTransaction.js";
import { deviceModuleTypes } from "../../device/deviceModuleTypes.js";
import { SignTransaction } from "../../device/use-case/SignTransaction.js";
import { SignTypedData } from "../../device/use-case/SignTypedData.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { TransactionService } from "./TransactionService.js";

@injectable()
export class DefaultTransactionService implements TransactionService {
  private _pendingParams?:
    | SignTransactionParams
    | SignRawTransactionParams
    | SignTypedMessageParams;
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(deviceModuleTypes.SignTransactionUseCase)
    private readonly signTransactionUseCase: SignTransaction,
    @inject(deviceModuleTypes.SignRawTransactionUseCase)
    private readonly signRawTransactionUseCase: SignRawTransaction,
    @inject(deviceModuleTypes.SignTypedDataUseCase)
    private readonly signTypedDataUseCase: SignTypedData,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: (prefix: string) => LoggerPublisher,
  ) {
    /*    @inject(deviceModuleTypes.BroadcastTransactionUseCase)
    private readonly broadcastTransactionUseCase: BroadcastTransaction,*/
    this.logger = loggerFactory("[DefaultTransactionService]");
  }

  sign(
    params:
      | SignRawTransactionParams
      | SignTypedMessageParams
      | SignTransactionParams,
    broadcast: boolean,
  ): Observable<SignFlowStatus> {
    this._pendingParams = params;

    this.logger.debug("Signing flow started", { params, broadcast });

    const useCase =
      "transaction" in params
        ? this.signTransactionUseCase.execute(params)
        : "typedData" in params
          ? this.signTypedDataUseCase.execute(params)
          : this.signRawTransactionUseCase.execute(params);

    return useCase;
  }

  getPendingTransaction():
    | SignTransactionParams
    | SignRawTransactionParams
    | SignTypedMessageParams
    | undefined {
    return this._pendingParams;
  }

  setPendingTransaction(
    params?:
      | SignTransactionParams
      | SignRawTransactionParams
      | SignTypedMessageParams,
  ): void {
    this._pendingParams = params;
  }

  reset(): void {
    this._pendingParams = undefined;
  }
}
