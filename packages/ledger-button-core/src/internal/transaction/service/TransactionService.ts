import { Observable } from "rxjs";

import {
  SignedTransaction,
  SignTransactionParams,
} from "../../device/use-case/SignTransaction.js";

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
  signTransaction(params: SignTransactionParams): Observable<TransactionResult>;

  getPendingTransaction(): SignTransactionParams | undefined;

  setPendingTransaction(params: SignTransactionParams | undefined): void;

  reset(): void;
}
