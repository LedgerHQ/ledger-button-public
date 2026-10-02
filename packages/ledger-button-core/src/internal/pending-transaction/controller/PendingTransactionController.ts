import { Observable } from "rxjs";

import { type BroadcastTracking } from "../model/BroadcastTracking";
import { type PendingTransaction } from "../model/PendingTransaction";

export interface PendingTransactionController {
  track(): void;
  observePendingTransactions(): Observable<PendingTransaction[]>;
  /**
   * Store a freshly broadcasted transaction and start tracking its lifecycle.
   * Subscribers of {@link observeBroadcastedTransaction} for that hash receive
   * `processing` as a direct consequence of this call.
   */
  registerBroadcastedTransaction(tx: PendingTransaction): void;
  /**
   * Lifecycle of one broadcasted transaction. Emits nothing until the hash has
   * been registered, so callers can subscribe as soon as they know the hash
   * without having to guard against the pool not being populated yet.
   */
  observeBroadcastedTransaction(hash: string): Observable<BroadcastTracking>;
}
