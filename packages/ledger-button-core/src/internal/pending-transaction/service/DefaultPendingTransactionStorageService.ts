import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { type PendingTransaction } from "../model/PendingTransaction.js";
import { type PendingTransactionStorageService } from "./PendingTransactionStorageService.js";

const STORAGE_KEY = "ledger-button:pending-txs";

@injectable()
export class DefaultPendingTransactionStorageService
  implements PendingTransactionStorageService
{
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("[PendingTransactionStorageService]");
  }

  add(tx: PendingTransaction): void {
    const current = this.getAll();
    const exists = current.some((existing) => existing.hash === tx.hash);
    if (exists) {
      this.logger.debug("Transaction already tracked, skipping", {
        hash: tx.hash,
      });
      return;
    }
    current.push(tx);
    this.write(current);
    this.logger.debug("Pending transaction added", { hash: tx.hash });
  }

  getAll(): PendingTransaction[] {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as PendingTransaction[];
    } catch (error) {
      this.logger.error("Failed to read pending transactions from storage", {
        error,
      });
      return [];
    }
  }

  remove(hash: string): void {
    const current = this.getAll();
    const filtered = current.filter((tx) => tx.hash !== hash);
    this.write(filtered);
    this.logger.debug("Pending transaction removed", { hash });
  }

  private write(txs: PendingTransaction[]): void {
    try {
      if (txs.length === 0) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
      }
    } catch (error) {
      this.logger.error("Failed to write pending transactions to storage", {
        error,
      });
    }
  }
}
