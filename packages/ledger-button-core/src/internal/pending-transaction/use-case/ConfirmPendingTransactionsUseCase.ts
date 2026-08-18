import { type Factory, inject, injectable } from "inversify";
import { Either } from "purify-ts";

import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";
import { type TransactionHistoryDataSource } from "@internal/transaction-history/datasource/coinService/TransactionHistoryDataSource";
import { transactionHistoryModuleTypes } from "@internal/transaction-history/di/transactionHistoryModuleTypes";
import type { TransactionHistoryPage } from "@internal/transaction-history/model/transactionHistoryTypes";

export type SettledPendingTransactionOutcome = {
  hash: string;
  failed: boolean;
};

@injectable()
export class ConfirmPendingTransactionsUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(transactionHistoryModuleTypes.TransactionHistoryDataSource)
    private readonly txHistoryDataSource: TransactionHistoryDataSource,
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = loggerFactory("[ConfirmPendingTransactionsUseCase]");
  }

  async execute(
    currencyId: string,
    address: string,
    pendingHashes: string[],
  ): Promise<Either<Error, SettledPendingTransactionOutcome[]>> {
    this.logPendingCheck(pendingHashes);

    const result = await this.txHistoryDataSource.getTransactions(
      address,
      currencyId,
    );

    return result.map((page) =>
      this.resolveSettledOutcomesFromPage(page, pendingHashes),
    );
  }

  private logPendingCheck(pendingHashes: string[]): void {
    this.logger.debug("Checking pending transactions against Explorer", {
      pendingHashes,
    });
  }

  private resolveSettledOutcomesFromPage(
    page: TransactionHistoryPage,
    pendingHashes: string[],
  ): SettledPendingTransactionOutcome[] {
    const onChainFailureByHash = this.buildOnChainFailureByHash(page);
    const settled = this.findSettledOutcomes(
      pendingHashes,
      onChainFailureByHash,
    );
    this.logSettledOutcomes(settled);
    return settled;
  }

  private buildOnChainFailureByHash(
    page: TransactionHistoryPage,
  ): Map<string, boolean> {
    return new Map(
      page.items.map((entry) => [entry.hash, entry.failed] as const),
    );
  }

  private findSettledOutcomes(
    pendingHashes: string[],
    onChainFailureByHash: Map<string, boolean>,
  ): SettledPendingTransactionOutcome[] {
    return pendingHashes
      .filter((hash) => onChainFailureByHash.has(hash))
      .map((hash) => ({
        hash,
        failed: onChainFailureByHash.get(hash) ?? false,
      }));
  }

  private logSettledOutcomes(
    settled: SettledPendingTransactionOutcome[],
  ): void {
    if (settled.length === 0) {
      return;
    }

    this.logger.debug("Settled transactions found", { settled });
  }
}
