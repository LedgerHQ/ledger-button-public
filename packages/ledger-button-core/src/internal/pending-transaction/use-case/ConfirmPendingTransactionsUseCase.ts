import { type Factory, inject, injectable } from "inversify";
import { Either } from "purify-ts";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { type TransactionHistoryDataSource } from "../../transaction-history/datasource/TransactionHistoryDataSource.js";
import { transactionHistoryModuleTypes } from "../../transaction-history/transactionHistoryModuleTypes.js";

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
    network: string,
    address: string,
    pendingHashes: string[],
  ): Promise<Either<Error, string[]>> {
    this.logger.debug("Checking pending transactions against Explorer", {
      pendingHashes,
    });

    const result = await this.txHistoryDataSource.getTransactions(
      network,
      address,
    );

    return result.map((response) => {
      const onChainHashes = new Set(response.data.map((tx) => tx.hash));
      const confirmed = pendingHashes.filter((hash) => onChainHashes.has(hash));

      if (confirmed.length > 0) {
        this.logger.debug("Confirmed transactions found", { confirmed });
      }

      return confirmed;
    });
  }
}
