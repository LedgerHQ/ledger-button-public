import { inject, injectable } from "inversify";
import { BehaviorSubject, from, Observable, Subject } from "rxjs";
import { finalize, tap } from "rxjs/operators";

import { deviceModuleTypes } from "../../device/deviceModuleTypes.js";
import {
  SignedTransaction,
  SignTransaction,
  SignTransactionParams,
} from "../../device/use-case/SignTransaction.js";
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
  private _pendingParams?: SignTransactionParams;
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(deviceModuleTypes.SignTransactionUseCase)
    private readonly signTransactionUseCase: SignTransaction,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: (prefix: string) => LoggerPublisher,
  ) {
    this.logger = loggerFactory("[DefaultTransactionService]");
  }

  signTransaction(params: SignTransactionParams): Observable<TransactionResult> {
    this._pendingParams = params;
    this._updateStatus(TransactionStatus.SIGNING);

    this.logger.info("Signing transaction", { params });

    from(this.signTransactionUseCase.execute(params))
      .pipe(
        tap((result) => {
          this.logger.info("Transaction signed successfully", { result });
        }),
        finalize(() => {
          this.logger.info("Transaction signing finalized");
        }),
      )
      .subscribe({
        next: (data: SignedTransaction) => {
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

  getPendingTransaction(): SignTransactionParams | undefined {
    return this._pendingParams;
  }

  setPendingTransaction(params: SignTransactionParams | undefined): void {
    this._pendingParams = params;
  }

  reset(): void {
    this._pendingParams = undefined;
    this._updateStatus(TransactionStatus.IDLE);
  }

  private _updateStatus(
    status: TransactionStatus,
    data?: SignedTransaction,
    error?: Error,
  ): void {
    this._status.next(status);
    this._result.next({ status, data, error });
  }
}
