import type { Signature } from "@ledgerhq/device-signer-kit-ethereum";
import { inject, injectable } from "inversify";
import { BehaviorSubject, from, Observable, Subject } from "rxjs";
import { finalize, tap } from "rxjs/operators";

import { deviceModuleTypes } from "../../device/deviceModuleTypes.js";
import { SendTransaction } from "../../device/use-case/SendTransaction.js";
import type {
  SignedTransaction,
  SignRawTransaction,
} from "../../device/use-case/SignRawTransaction.js";
import { SignRawTransactionParams } from "../../device/use-case/SignRawTransaction.js";
import {
  SignTransaction,
  type SignTransactionParams,
} from "../../device/use-case/SignTransaction.js";
import {
  SignTypedData,
  type SignTypedDataParams,
} from "../../device/use-case/SignTypedData.js";
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
    | SignTypedDataParams;
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(deviceModuleTypes.SignTransactionUseCase)
    private readonly signTransactionUseCase: SignTransaction,
    @inject(deviceModuleTypes.SignRawTransactionUseCase)
    private readonly signRawTransactionUseCase: SignRawTransaction,
    @inject(deviceModuleTypes.SignTypedDataUseCase)
    private readonly signTypedDataUseCase: SignTypedData,
    @inject(deviceModuleTypes.SendTransactionUseCase)
    private readonly sendTransactionUseCase: SendTransaction,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: (prefix: string) => LoggerPublisher,
  ) {
    this.logger = loggerFactory("[DefaultTransactionService]");
  }

  sign(
    params:
      | SignRawTransactionParams
      | SignTypedDataParams
      | SignTransactionParams,
    broadcast: boolean,
  ): Observable<TransactionResult> {
    this._pendingParams = params;
    this._updateStatus(TransactionStatus.SIGNING);

    const useCase =
      "transaction" in params
        ? broadcast
          ? this.sendTransactionUseCase.execute(params)
          : this.signTransactionUseCase.execute(params)
        : "typedData" in params
          ? this.signTypedDataUseCase.execute(params)
          : this.signRawTransactionUseCase.execute(params);

    from(useCase)
      .pipe(
        tap((result) => {
          this.logger.info("Transaction signed successfully", { result });
        }),
        finalize(() => {
          this.logger.info("Transaction signing finalized");
        }),
      )
      .subscribe({
        next: (data) => {
          this._pendingParams = undefined;
          this._updateStatus(TransactionStatus.SIGNED, data);
        },
        error: (error: Error) => {
          this.logger.error("Transaction signing failed", { error });
          this._updateStatus(TransactionStatus.ERROR, undefined, error);
        },
      });

    return this._result.asObservable();
  }

  getPendingTransaction():
    | SignTransactionParams
    | SignRawTransactionParams
    | SignTypedDataParams
    | undefined {
    return this._pendingParams;
  }

  setPendingTransaction(
    params:
      | SignTransactionParams
      | SignRawTransactionParams
      | SignTypedDataParams
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
