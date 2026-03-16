import type { Factory } from "inversify";
import { inject, injectable } from "inversify";
import type { Either } from "purify-ts";

import { balanceModuleTypes } from "../../balance/balanceModuleTypes.js";
import type { CounterValueDataSource } from "../../balance/datasource/countervalue/CounterValueDataSource.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type { TransactionHistoryItem } from "../model/transactionHistoryTypes.js";

type DateRange = {
  minDate: string;
  maxDate: string;
};

@injectable()
export class HydrateTransactionsWithFiatUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(balanceModuleTypes.CounterValueDataSource)
    private readonly counterValueDataSource: CounterValueDataSource,
  ) {
    this.logger = loggerFactory("[HydrateTransactionsWithFiatUseCase]");
  }

  /**
   * Hydrates transactions with fiat values by fetching historical exchange rates.
   *
   * Process:
   * 1. Groups transactions by ledgerId (native currency vs tokens)
   * 2. For each group, fetches historical rates from Counter Value API
   * 3. Applies the correct rate to each transaction based on its date
   * 4. Returns transactions with fiatValue and fiatCurrency fields populated
   *
   */
  async execute(
    transactions: TransactionHistoryItem[],
    targetCurrency: string,
  ): Promise<TransactionHistoryItem[]> {
    if (transactions.length === 0) {
      return [];
    }

    const transactionsByLedgerId =
      this.groupTransactionsByLedgerId(transactions);

    const hydratedTransactions = await Promise.all(
      Array.from(transactionsByLedgerId.entries()).map(
        async ([ledgerId, txGroup]) => {
          return this.hydrateTransactionGroup(
            txGroup,
            ledgerId,
            targetCurrency,
          );
        },
      ),
    );

    return hydratedTransactions.flat();
  }

  /**
   * Groups transactions by their ledgerId.
   *
   * The ledgerId identifies the asset type:
   * - "ethereum" for native ETH transactions
   * - "ethereum/erc20/usdc" for USDC token transactions
   * - "ethereum/erc20/dai" for DAI token transactions
   * - etc.
   *
   * Transactions without a ledgerId are grouped under "unknown" and will be skipped
   * during fiat hydration.
   */
  private groupTransactionsByLedgerId(
    transactions: TransactionHistoryItem[],
  ): Map<string, TransactionHistoryItem[]> {
    const grouped = new Map<string, TransactionHistoryItem[]>();

    for (const tx of transactions) {
      // Use "unknown" as fallback for transactions without ledgerId
      const ledgerId = tx.ledgerId ?? "unknown";
      const group = grouped.get(ledgerId) ?? [];
      group.push(tx);
      grouped.set(ledgerId, group);
    }

    return grouped;
  }

  private async hydrateTransactionGroup(
    transactions: TransactionHistoryItem[],
    ledgerId: string,
    targetCurrency: string,
  ): Promise<TransactionHistoryItem[]> {
    if (ledgerId === "unknown") {
      this.logger.warn(
        "Skipping fiat hydration for transactions without ledgerId",
        {
          transactionCount: transactions.length,
        },
      );
      return transactions;
    }

    const { minDate, maxDate } = this.getDateRange(transactions);

    const ratesResult: Either<
      Error,
      Record<string, number>
    > = await this.counterValueDataSource.getHistoricalRates(
      ledgerId,
      targetCurrency,
      minDate,
      maxDate,
    );

    return ratesResult.caseOf({
      Left: (error) => {
        this.logger.warn("Failed to fetch historical rates for transactions", {
          error: error.message,
          ledgerId,
          targetCurrency,
          transactionCount: transactions.length,
        });
        return transactions;
      },
      Right: (rates) =>
        this.applyHistoricalRatesToTransactions(
          transactions,
          rates,
          targetCurrency.toUpperCase(),
        ),
    });
  }

  private getDateRange(transactions: TransactionHistoryItem[]): DateRange {
    const dates = transactions.map((tx) =>
      this.getDateFromTimestamp(tx.timestamp),
    );
    const minDate = dates.reduce((a, b) => (a < b ? a : b));
    const maxDate = dates.reduce((a, b) => (a > b ? a : b));
    return { minDate, maxDate };
  }

  private getDateFromTimestamp(timestamp: string): string {
    return timestamp.slice(0, 10);
  }

  private applyHistoricalRatesToTransactions(
    transactions: TransactionHistoryItem[],
    rates: Record<string, number>,
    fiatCurrency: string,
  ): TransactionHistoryItem[] {
    return transactions.map((tx) => {
      const date = this.getDateFromTimestamp(tx.timestamp);
      const rate = rates[date];

      if (rate === undefined) {
        return tx;
      }

      const valueNum = parseFloat(tx.formattedValue);
      if (Number.isNaN(valueNum)) {
        return tx;
      }

      const fiatValue = (valueNum * rate).toFixed(2);
      return {
        ...tx,
        fiatValue,
        fiatCurrency,
      };
    });
  }
}
