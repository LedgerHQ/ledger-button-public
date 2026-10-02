import type { Factory } from "inversify";
import { inject, injectable } from "inversify";
import type { Either } from "purify-ts";

import type { CounterValueDataSource } from "@internal/balance/datasource/countervalue/CounterValueDataSource";
import { balanceModuleTypes } from "@internal/balance/di/balanceModuleTypes";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import type { PendingTransaction } from "../model/PendingTransaction";

type DateRange = {
  minDate: string;
  maxDate: string;
};

@injectable()
export class HydratePendingTransactionsWithFiatUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(balanceModuleTypes.CounterValueDataSource)
    private readonly counterValueDataSource: CounterValueDataSource,
  ) {
    this.logger = loggerFactory(
      "[HydratePendingTransactionsWithFiatUseCase]",
    );
  }

  async execute(
    transactions: PendingTransaction[],
    targetCurrency: string,
  ): Promise<PendingTransaction[]> {
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

  private groupTransactionsByLedgerId(
    transactions: PendingTransaction[],
  ): Map<string, PendingTransaction[]> {
    const grouped = new Map<string, PendingTransaction[]>();

    for (const tx of transactions) {
      const group = grouped.get(tx.ledgerId) ?? [];
      group.push(tx);
      grouped.set(tx.ledgerId, group);
    }

    return grouped;
  }

  private async hydrateTransactionGroup(
    transactions: PendingTransaction[],
    ledgerId: string,
    targetCurrency: string,
  ): Promise<PendingTransaction[]> {
    const { minDate, maxDate } = this.getDateRange(transactions);

    const ratesResult: Either<Error, Record<string, number>> =
      await this.counterValueDataSource.getHistoricalRates(
        ledgerId,
        targetCurrency,
        minDate,
        maxDate,
      );

    return ratesResult.caseOf({
      Left: (error) => {
        this.logger.warn(
          "Failed to fetch historical rates for pending transactions",
          {
            error: error.message,
            ledgerId,
            targetCurrency,
            transactionCount: transactions.length,
          },
        );
        return transactions;
      },
      Right: (rates) =>
        this.applyRatesToTransactions(
          transactions,
          rates,
          targetCurrency.toUpperCase(),
        ),
    });
  }

  private getDateRange(transactions: PendingTransaction[]): DateRange {
    const [firstDate, ...restDates] = transactions.map((tx) =>
      this.getDateFromTimestamp(tx.timestamp),
    );
    const minDate = restDates.reduce((a, b) => (a < b ? a : b), firstDate);
    const maxDate = restDates.reduce((a, b) => (a > b ? a : b), firstDate);
    return { minDate, maxDate };
  }

  private getDateFromTimestamp(timestamp: string): string {
    return timestamp.slice(0, 10);
  }

  private applyRatesToTransactions(
    transactions: PendingTransaction[],
    rates: Record<string, number>,
    fiatCurrency: string,
  ): PendingTransaction[] {
    return transactions.map((tx) => {
      const date = this.getDateFromTimestamp(tx.timestamp);
      const rate = rates[date];

      if (rate === undefined) {
        return tx;
      }

      const valueNum = parseFloat(tx.formattedValue ?? "");
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
