import { BigNumber } from "bignumber.js";
import type { Factory } from "inversify";
import { inject, injectable } from "inversify";
import type { Either } from "purify-ts";

import { balanceModuleTypes } from "../../balance/balanceModuleTypes.js";
import type { CounterValueDataSource } from "../../balance/datasource/countervalue/CounterValueDataSource.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import type { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import type {
  TransactionHistoryItem,
  TransactionHistoryItemFee,
} from "../model/transactionHistoryTypes.js";

type DateRange = {
  minDate: string;
  maxDate: string;
};

const UNKNOWN_LEDGER_ID = "unknown";

@injectable()
export class HydrateTransactionsWithFiatUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(balanceModuleTypes.CounterValueDataSource)
    private readonly counterValueDataSource: CounterValueDataSource,
  ) {
    this.logger = loggerFactory("HydrateTransactionsWithFiatUseCase");
  }

  /**
   * Hydrates transactions with fiat values by fetching historical exchange
   * rates.
   *
   * Process:
   * 1. Groups transactions by ledgerId (native currency vs tokens).
   * 2. For each group, fetches historical rates from Counter Value API.
   * 3. Applies the correct rate to each transaction (and to its fee when the
   *    fee asset matches the transaction asset).
   * 4. Returns transactions with `fiatValue`/`fiatCurrency` populated, and
   *    `fee.fiatAmount` populated when applicable.
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
   * Groups transactions by their `asset.ledgerId`. Transactions without a
   * `ledgerId` end up under `UNKNOWN_LEDGER_ID` and skip hydration.
   */
  private groupTransactionsByLedgerId(
    transactions: TransactionHistoryItem[],
  ): Map<string, TransactionHistoryItem[]> {
    const grouped = new Map<string, TransactionHistoryItem[]>();

    for (const tx of transactions) {
      const ledgerId = tx.asset.ledgerId ?? UNKNOWN_LEDGER_ID;
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
    if (ledgerId === UNKNOWN_LEDGER_ID) {
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

      const fiatValue = this.computeFiat(tx.value, tx.asset.decimals, rate);
      const fiatFee = this.computeFiatFee(tx, rate);

      if (fiatValue === undefined && fiatFee === undefined) {
        return tx;
      }

      const next: TransactionHistoryItem = { ...tx, fiatCurrency };
      if (fiatValue !== undefined) {
        next.fiatValue = fiatValue;
      }
      if (fiatFee !== undefined && tx.fee !== undefined) {
        next.fee = { ...tx.fee, fiatAmount: fiatFee };
      }
      return next;
    });
  }

  /**
   * The historical rate fetched here is for `tx.asset.ledgerId` (the asset of
   * the transferred value). It only applies to the fee when the fee asset
   * matches that asset — typically native transfers and the fees-only rows
   * of failed transactions, where both fall back to the native asset.
   */
  private computeFiatFee(
    tx: TransactionHistoryItem,
    rate: number,
  ): string | undefined {
    const fee: TransactionHistoryItemFee | undefined = tx.fee;
    if (!fee) {
      return undefined;
    }
    if (fee.asset.ledgerId !== tx.asset.ledgerId) {
      return undefined;
    }
    return this.computeFiat(fee.amount, fee.asset.decimals, rate);
  }

  private computeFiat(
    rawAmount: string,
    decimals: number,
    rate: number,
  ): string | undefined {
    const value = new BigNumber(rawAmount);
    if (!value.isFinite()) {
      return undefined;
    }
    return value
      .shiftedBy(-decimals)
      .multipliedBy(rate)
      .toFixed(2);
  }
}
