import { Observable } from "rxjs";

import {
  SignedTransaction,
  SignFlowStatus,
  SignRawTransactionParams,
  SignTransactionParams,
  SignTypedMessageParams,
} from "../../../api/index.js";
import { Signature } from "../../../api/model/eip/EIPTypes.js";

//TODO see to align with types defined in SignRawTransaction.ts
export enum TransactionStatus {
  IDLE = "idle",
  SIGNING = "signing",
  SIGNED = "signed",
  ERROR = "error",
  USER_INTERACTION_NEEDED = "user-interaction-needed",
}

export interface TransactionResult {
  status: TransactionStatus;
  data?: SignedTransaction | Signature;
  error?: Error;
}

export interface TransactionService {
  sign(
    params:
      | SignTransactionParams
      | SignRawTransactionParams
      | SignTypedMessageParams,
    broadcast: boolean,
  ): Observable<SignFlowStatus>;

  getPendingTransaction():
    | SignTransactionParams
    | SignRawTransactionParams
    | SignTypedMessageParams
    | undefined;

  setPendingTransaction(
    params:
      | SignTransactionParams
      | SignRawTransactionParams
      | SignTypedMessageParams
      | undefined,
  ): void;

  reset(): void;
}
