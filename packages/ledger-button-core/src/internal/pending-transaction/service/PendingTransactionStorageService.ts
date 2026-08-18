import { type PendingTransaction } from "../model/PendingTransaction";

export interface PendingTransactionStorageService {
  add(tx: PendingTransaction): void;
  getAll(): PendingTransaction[];
  remove(hash: string): void;
}
