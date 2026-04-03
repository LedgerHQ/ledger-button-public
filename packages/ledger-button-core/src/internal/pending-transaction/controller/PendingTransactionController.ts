import { Observable } from "rxjs";

import { type PendingTransaction } from "../model/PendingTransaction.js";

export interface PendingTransactionController {
  track(): void;
  observePendingTransactions(): Observable<PendingTransaction[]>;
}
