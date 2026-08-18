import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  TransactionHistoryItem,
  TransactionHistoryItemAsset,
} from "@api/model/TransactionHistory";
import type { CounterValueDataSource } from "@internal/balance/datasource/countervalue/CounterValueDataSource";

import { HydrateTransactionsWithFiatUseCase } from "./HydrateTransactionsWithFiatUseCase";

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

const NATIVE_ASSET: TransactionHistoryItemAsset = {
  ledgerId: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  decimals: 18,
};

const ERC20_ASSET: TransactionHistoryItemAsset = {
  ledgerId: "ethereum/erc20/usdc",
  name: "USD Coin",
  ticker: "USDC",
  decimals: 6,
};

function createMockTransaction(
  overrides: Partial<TransactionHistoryItem> = {},
): TransactionHistoryItem {
  return {
    hash: "0xabc123",
    type: "sent",
    direction: "sent",
    kind: "transfer",
    status: "confirmed",
    value: "500000000000000000",
    asset: NATIVE_ASSET,
    timestamp: "2024-01-15T10:30:00Z",
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
    it("returns empty array when transactions is empty", async () => {
      const result = await useCase.execute([], "usd");

      expect(result).toEqual([]);
      expect(
        mockCounterValueDataSource.getHistoricalRates,
      ).not.toHaveBeenCalled();
    });

    it("hydrates transactions with fiat value and currency when rates are available", async () => {
      const transactions = [
        createMockTransaction({
          hash: "0x111",
          value: "1000000000000000000",
          timestamp: "2024-01-10T12:00:00Z",
        }),
        createMockTransaction({
          hash: "0x222",
          value: "2000000000000000000",
          timestamp: "2024-01-15T08:00:00Z",
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
        hash: "0x111",
        fiatValue: "2500.00",
        fiatCurrency: "USD",
      });
      expect(result[1]).toMatchObject({
        hash: "0x222",
        fiatValue: "5200.00",
        fiatCurrency: "USD",
      });
    });

    it("leaves fiat unset when rate is missing for a date", async () => {
      const transactions = [
        createMockTransaction({
          value: "1000000000000000000",
          timestamp: "2024-01-20T12:00:00Z",
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

    it("returns original transactions when datasource returns Left", async () => {
      const transactions = [
        createMockTransaction({
          hash: "0x111",
          value: "1000000000000000000",
        }),
      ];
      mockCounterValueDataSource.getHistoricalRates.mockResolvedValue(
        Left(new Error("Network error")),
      );

      const result = await useCase.execute(transactions, "usd");

      expect(result).toEqual(transactions);
      expect(result[0]).not.toHaveProperty("fiatValue");
    });

    it("hydrates fee.fiatAmount when the fee asset matches the transaction asset", async () => {
      const transactions = [
        createMockTransaction({
          hash: "0xfailed",
          kind: "fees",
          status: "failed",
          value: "0",
          asset: NATIVE_ASSET,
          timestamp: "2024-01-15T10:00:00Z",
          fee: {
            amount: "134240000000000",
            asset: NATIVE_ASSET,
          },
        }),
      ];
      mockCounterValueDataSource.getHistoricalRates.mockResolvedValue(
        Right({ "2024-01-15": 3354 }),
      );

      const result = await useCase.execute(transactions, "usd");

      expect(result[0]).toMatchObject({
        fiatValue: "0.00",
        fiatCurrency: "USD",
      });
      expect(result[0]?.fee?.fiatAmount).toBe("0.45");
    });

    it("does not hydrate fee.fiatAmount when fee asset differs from transaction asset (ERC20 transfer with native fee)", async () => {
      const transactions = [
        createMockTransaction({
          hash: "0xerc20",
          kind: "transfer",
          status: "confirmed",
          value: "5000000",
          asset: ERC20_ASSET,
          timestamp: "2024-01-15T10:00:00Z",
          fee: {
            amount: "210000000000000",
            asset: NATIVE_ASSET,
          },
        }),
      ];
      mockCounterValueDataSource.getHistoricalRates.mockResolvedValue(
        Right({ "2024-01-15": 1.0 }),
      );

      const result = await useCase.execute(transactions, "usd");

      expect(result[0]).toMatchObject({
        fiatValue: "5.00",
        fiatCurrency: "USD",
      });
      expect(result[0]?.fee?.fiatAmount).toBeUndefined();
    });

    it("computes min and max date across all transactions in a group", async () => {
      const transactions = [
        createMockTransaction({ timestamp: "2024-02-01T00:00:00Z" }),
        createMockTransaction({ timestamp: "2024-01-05T00:00:00Z" }),
        createMockTransaction({ timestamp: "2024-01-15T00:00:00Z" }),
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

    it("groups transactions by asset.ledgerId and fetches rates per group", async () => {
      const transactions = [
        createMockTransaction({
          hash: "0x111",
          value: "1000000000000000000",
          timestamp: "2024-01-10T12:00:00Z",
          asset: NATIVE_ASSET,
        }),
        createMockTransaction({
          hash: "0x222",
          value: "100000000",
          timestamp: "2024-01-10T12:00:00Z",
          asset: ERC20_ASSET,
        }),
      ];
      const ethRates: Record<string, number> = { "2024-01-10": 2500 };
      const usdcRates: Record<string, number> = { "2024-01-10": 1.0 };

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
        hash: "0x111",
        fiatValue: "2500.00",
        fiatCurrency: "USD",
      });
      expect(result[1]).toMatchObject({
        hash: "0x222",
        fiatValue: "100.00",
        fiatCurrency: "USD",
      });
    });
  });
});
