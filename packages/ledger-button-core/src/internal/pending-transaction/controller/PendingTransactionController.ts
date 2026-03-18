import { Observable } from "rxjs";

import { type PendingTransaction } from "../model/PendingTransaction.js";

export interface PendingTransactionController {
  track(tx: PendingTransaction): void;
  observePendingTransactions(): Observable<PendingTransaction[]>;
}
