import { type PendingTransaction } from "../model/PendingTransaction.js";

export interface PendingTransactionStorageService {
  add(tx: PendingTransaction): void;
  getAll(): PendingTransaction[];
  remove(hash: string): void;
}
