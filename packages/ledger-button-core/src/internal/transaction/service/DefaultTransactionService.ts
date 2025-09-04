import { inject, injectable } from "inversify";
import { BehaviorSubject, Observable, Subject } from "rxjs";

import {
  Signature,
  SignedTransaction,
  SignTypedMessageParams,
} from "../../../api/model/index.js";
import { type SignRawTransactionParams } from "../../../api/model/signing/SignRawTransactionParams.js";
import { SignTransactionParams } from "../../../api/model/signing/SignTransactionParams.js";
import { SignedTransactionResult } from "../../../api/model/signing/SignTransactionResult.js";
import { SignRawTransaction } from "../../../internal/device/use-case/SignRawTransaction.js";
import { deviceModuleTypes } from "../../device/deviceModuleTypes.js";
import { SignTransaction } from "../../device/use-case/SignTransaction.js";
import { SignTypedData } from "../../device/use-case/SignTypedData.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import {
  TransactionResult,
  TransactionService,
  TransactionStatus,
} from "./TransactionService.js";

@injectable()
export class DefaultTransactionService implements TransactionService {
  private _status = new BehaviorSubject<TransactionStatus>(
    TransactionStatus.IDLE,
  );
  private _result = new Subject<TransactionResult>();
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
  ): Observable<SignedTransactionResult> {
    this._pendingParams = params;
    this._updateStatus(TransactionStatus.SIGNING);

    this.logger.debug("Signing flow started", { params, broadcast });

    const useCase =
      "transaction" in params
        ? this.signTransactionUseCase.execute(params)
        : "typedData" in params
          ? this.signTypedDataUseCase.execute(params)
          : this.signRawTransactionUseCase.execute(params);

    /*  if (broadcast) {
      const broadcastObservable = from(
        this.broadcastTransactionUseCase.execute(res),
      ).pipe(
        map((transactionHash: TransactionHash) => {
          return {
            status: "success",
            data: {
              hash: transactionHash,
            },
          };
        }),
      );
      return concat(useCase, broadcastObservable);
    } else {
      }*/
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
    params:
      | SignTransactionParams
      | SignRawTransactionParams
      | SignTypedMessageParams
      | undefined,
  ): void {
    this._pendingParams = params;
  }

  reset(): void {
    this._pendingParams = undefined;
    this._updateStatus(TransactionStatus.IDLE);
  }

  private _updateStatus(
    status: TransactionStatus,
    data?: SignedTransaction | Signature,
    error?: Error,
  ): void {
    this._status.next(status);
    this._result.next({ status, data, error });
  }
}
