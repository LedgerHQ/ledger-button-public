import { Observable } from "rxjs";

import type {
  SignedTransaction,
  SignRawTransactionParams,
} from "../../device/use-case/SignRawTransaction.js";
import type { SignTransactionParams } from "../../device/use-case/SignTransaction.js";

export enum TransactionStatus {
  IDLE = "idle",
  SIGNING = "signing",
  SIGNED = "signed",
  ERROR = "error",
  USER_INTERACTION_NEEDED = "user-interaction-needed",
}

export interface TransactionResult {
  status: TransactionStatus;
  data?: SignedTransaction;
  error?: Error;
}

export interface TransactionService {
  signTransaction(
    params: SignTransactionParams | SignRawTransactionParams,
  ): Observable<TransactionResult>;

  getPendingTransaction():
    | SignTransactionParams
    | SignRawTransactionParams
    | undefined;

  setPendingTransaction(
    params: SignTransactionParams | SignRawTransactionParams | undefined,
  ): void;

  reset(): void;
}
