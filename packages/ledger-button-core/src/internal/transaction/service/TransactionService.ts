import type { Signature } from "@ledgerhq/device-signer-kit-ethereum";
import { Observable } from "rxjs";

import type {
  SignedTransaction,
  SignRawTransactionParams,
} from "../../device/use-case/SignRawTransaction.js";
import type { SignTransactionParams } from "../../device/use-case/SignTransaction.js";
import type { SignTypedDataParams } from "../../device/use-case/SignTypedData.js";

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
      | SignTypedDataParams,
    broadcast: boolean,
  ): Observable<TransactionResult>;

  getPendingTransaction():
    | SignTransactionParams
    | SignRawTransactionParams
    | SignTypedDataParams
    | undefined;

  setPendingTransaction(
    params:
      | SignTransactionParams
      | SignRawTransactionParams
      | SignTypedDataParams
      | undefined,
  ): void;

  reset(): void;
}
