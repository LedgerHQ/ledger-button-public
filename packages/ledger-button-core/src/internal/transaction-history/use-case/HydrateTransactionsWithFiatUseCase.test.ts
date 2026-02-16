import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CounterValueDataSource } from "../../balance/datasource/countervalue/CounterValueDataSource.js";
import type { TransactionHistoryItem } from "../model/transactionHistoryTypes.js";
import { HydrateTransactionsWithFiatUseCase } from "./HydrateTransactionsWithFiatUseCase.js";

function createMockLogger() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    fatal: vi.fn(),
    subscribers: [],
  };
}

function createMockLoggerFactory() {
  return vi.fn().mockReturnValue(createMockLogger());
}

function createMockCounterValueDataSource(): {
  getHistoricalRates: ReturnType<typeof vi.fn>;
} {
  return {
    getHistoricalRates: vi.fn(),
  };
}

function createMockTransaction(
  overrides: Partial<TransactionHistoryItem> = {},
): TransactionHistoryItem {
  return {
    hash: "0xabc123",
    type: "sent",
    value: "500000000000000000",
    formattedValue: "0.5",
    currencyName: "Ethereum",
    ticker: "ETH",
    timestamp: "2024-01-15T10:30:00Z",
    ledgerId: "ethereum",
    ...overrides,
  };
}

describe("HydrateTransactionsWithFiatUseCase", () => {
  let useCase: HydrateTransactionsWithFiatUseCase;
  let mockCounterValueDataSource: ReturnType<
    typeof createMockCounterValueDataSource
  >;
  let mockLoggerFactory: ReturnType<typeof createMockLoggerFactory>;

  beforeEach(() => {
    mockCounterValueDataSource = createMockCounterValueDataSource();
    mockLoggerFactory = createMockLoggerFactory();

    useCase = new HydrateTransactionsWithFiatUseCase(
      mockLoggerFactory,
      mockCounterValueDataSource as unknown as CounterValueDataSource,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should return empty array when transactions is empty", async () => {
      const result = await useCase.execute([], "usd");

      expect(result).toEqual([]);
      expect(
        mockCounterValueDataSource.getHistoricalRates,
      ).not.toHaveBeenCalled();
    });

    it("should hydrate transactions with fiat value and currency when rates are available", async () => {
      const transactions = [
        createMockTransaction({
          hash: "0x111",
          formattedValue: "1",
          timestamp: "2024-01-10T12:00:00Z",
          ledgerId: "ethereum",
        }),
        createMockTransaction({
          hash: "0x222",
          formattedValue: "2",
          timestamp: "2024-01-15T08:00:00Z",
          ledgerId: "ethereum",
        }),
      ];
      const rates: Record<string, number> = {
        "2024-01-10": 2500,
        "2024-01-15": 2600,
      };
      mockCounterValueDataSource.getHistoricalRates.mockResolvedValue(
        Right(rates),
      );

      const result = await useCase.execute(transactions, "usd");

      expect(
        mockCounterValueDataSource.getHistoricalRates,
      ).toHaveBeenCalledWith("ethereum", "usd", "2024-01-10", "2024-01-15");
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        ...transactions[0],
        fiatValue: "2500.00",
        fiatCurrency: "USD",
      });
      expect(result[1]).toMatchObject({
        ...transactions[1],
        fiatValue: "5200.00",
        fiatCurrency: "USD",
      });
    });

    it("should leave fiat unset when rate is missing for a date", async () => {
      const transactions = [
        createMockTransaction({
          formattedValue: "1",
          timestamp: "2024-01-20T12:00:00Z",
          ledgerId: "ethereum",
        }),
      ];
      const rates: Record<string, number> = {
        "2024-01-10": 2500,
      };
      mockCounterValueDataSource.getHistoricalRates.mockResolvedValue(
        Right(rates),
      );

      const result = await useCase.execute(transactions, "usd");

      expect(result[0]).not.toHaveProperty("fiatValue");
      expect(result[0]).not.toHaveProperty("fiatCurrency");
    });

    it("should return original transactions when datasource returns Left", async () => {
      const transactions = [
        createMockTransaction({
          hash: "0x111",
          formattedValue: "1",
          ledgerId: "ethereum",
        }),
      ];
      mockCounterValueDataSource.getHistoricalRates.mockResolvedValue(
        Left(new Error("Network error")),
      );

      const result = await useCase.execute(transactions, "usd");

      expect(result).toEqual(transactions);
      expect(result[0]).not.toHaveProperty("fiatValue");
    });

    it("should not set fiat when formattedValue is not a valid number", async () => {
      const transactions = [
        createMockTransaction({
          formattedValue: "invalid",
          timestamp: "2024-01-15T12:00:00Z",
          ledgerId: "ethereum",
        }),
      ];
      mockCounterValueDataSource.getHistoricalRates.mockResolvedValue(
        Right({ "2024-01-15": 2600 }),
      );

      const result = await useCase.execute(transactions, "usd");

      expect(result[0]).not.toHaveProperty("fiatValue");
      expect(result[0]).not.toHaveProperty("fiatCurrency");
    });

    it("should compute min and max date from all transactions", async () => {
      const transactions = [
        createMockTransaction({
          timestamp: "2024-02-01T00:00:00Z",
          ledgerId: "ethereum",
        }),
        createMockTransaction({
          timestamp: "2024-01-05T00:00:00Z",
          ledgerId: "ethereum",
        }),
        createMockTransaction({
          timestamp: "2024-01-15T00:00:00Z",
          ledgerId: "ethereum",
        }),
      ];
      mockCounterValueDataSource.getHistoricalRates.mockResolvedValue(
        Right({
          "2024-01-05": 2400,
          "2024-01-15": 2500,
          "2024-02-01": 2600,
        }),
      );

      await useCase.execute(transactions, "usd");

      expect(
        mockCounterValueDataSource.getHistoricalRates,
      ).toHaveBeenCalledWith("ethereum", "usd", "2024-01-05", "2024-02-01");
    });

    it("should group transactions by ledgerId and fetch rates separately", async () => {
      const transactions = [
        createMockTransaction({
          hash: "0x111",
          formattedValue: "1",
          timestamp: "2024-01-10T12:00:00Z",
          ledgerId: "ethereum",
        }),
        createMockTransaction({
          hash: "0x222",
          formattedValue: "100",
          timestamp: "2024-01-10T12:00:00Z",
          ledgerId: "ethereum/erc20/usdc",
          currencyName: "USD Coin",
          ticker: "USDC",
        }),
      ];
      const ethRates: Record<string, number> = {
        "2024-01-10": 2500,
      };
      const usdcRates: Record<string, number> = {
        "2024-01-10": 1.0,
      };

      mockCounterValueDataSource.getHistoricalRates
        .mockResolvedValueOnce(Right(ethRates))
        .mockResolvedValueOnce(Right(usdcRates));

      const result = await useCase.execute(transactions, "usd");

      expect(
        mockCounterValueDataSource.getHistoricalRates,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockCounterValueDataSource.getHistoricalRates,
      ).toHaveBeenNthCalledWith(
        1,
        "ethereum",
        "usd",
        "2024-01-10",
        "2024-01-10",
      );
      expect(
        mockCounterValueDataSource.getHistoricalRates,
      ).toHaveBeenNthCalledWith(
        2,
        "ethereum/erc20/usdc",
        "usd",
        "2024-01-10",
        "2024-01-10",
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        ...transactions[0],
        fiatValue: "2500.00",
        fiatCurrency: "USD",
      });
      expect(result[1]).toMatchObject({
        ...transactions[1],
        fiatValue: "100.00",
        fiatCurrency: "USD",
      });
    });

    it("should skip fiat hydration for transactions without ledgerId", async () => {
      const transactions = [
        createMockTransaction({
          hash: "0x111",
          formattedValue: "1",
          timestamp: "2024-01-10T12:00:00Z",
          ledgerId: undefined,
        }),
      ];

      const result = await useCase.execute(transactions, "usd");

      expect(
        mockCounterValueDataSource.getHistoricalRates,
      ).not.toHaveBeenCalled();
      expect(result).toEqual(transactions);
      expect(result[0]).not.toHaveProperty("fiatValue");
    });
  });
});
