import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CalDataSource } from "../../balance/datasource/cal/CalDataSource.js";
import type { TransactionHistoryDataSource } from "../datasource/TransactionHistoryDataSource.js";
import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import type {
  TransactionHistoryEntry,
  TransactionHistoryEntryAsset,
  TransactionHistoryPage,
} from "../model/transactionHistoryTypes.js";
import { FetchTransactionHistoryUseCase } from "./FetchTransactionHistoryUseCase.js";

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

function createMockDataSource(): {
  getTransactions: ReturnType<typeof vi.fn>;
} {
  return {
    getTransactions: vi.fn(),
  };
}

function createMockCalDataSource(): {
  getTokenInformation: ReturnType<typeof vi.fn>;
  getCurrencyInformation: ReturnType<typeof vi.fn>;
} {
  return {
    getTokenInformation: vi.fn().mockResolvedValue(
      Right({
        id: "ethereum/erc20/usdc",
        name: "USD Coin",
        ticker: "USDC",
        decimals: 6,
      }),
    ),
    getCurrencyInformation: vi.fn().mockResolvedValue(
      Right({
        id: "ethereum",
        name: "Ethereum",
        ticker: "ETH",
        decimals: 18,
        transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
      }),
    ),
  };
}

const NATIVE_ASSET: TransactionHistoryEntryAsset = { isNative: true };

function makeEntry(
  overrides: Partial<TransactionHistoryEntry> = {},
): TransactionHistoryEntry {
  return {
    hash: "0xabc123",
    value: "0",
    senders: [],
    recipients: [],
    fee: undefined,
    failed: false,
    blockHeight: 19_000_000,
    timestamp: "2024-01-15T10:30:00Z",
    asset: NATIVE_ASSET,
    direction: "out",
    isFees: false,
    ...overrides,
  };
}

function pageOf(...items: TransactionHistoryEntry[]): TransactionHistoryPage {
  return { items, nextPageToken: undefined };
}

describe("FetchTransactionHistoryUseCase", () => {
  let useCase: FetchTransactionHistoryUseCase;
  let mockDataSource: ReturnType<typeof createMockDataSource>;
  let mockCalDataSource: ReturnType<typeof createMockCalDataSource>;
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const testCurrencyId = "ethereum";

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    mockCalDataSource = createMockCalDataSource();

    useCase = new FetchTransactionHistoryUseCase(
      createMockLoggerFactory(),
      mockDataSource as unknown as TransactionHistoryDataSource,
      mockCalDataSource as unknown as CalDataSource,
    );

    vi.clearAllMocks();
  });

  describe("port + CAL composition", () => {
    it("forwards address, currencyId and options to the data source", async () => {
      mockDataSource.getTransactions.mockResolvedValue(Right(pageOf()));

      await useCase.execute(testAddress, testCurrencyId, { pageToken: "abc" });

      expect(mockDataSource.getTransactions).toHaveBeenCalledWith(
        testAddress,
        testCurrencyId,
        { pageToken: "abc" },
      );
    });

    it("requests currency information from CAL using the same currencyId", async () => {
      mockDataSource.getTransactions.mockResolvedValue(Right(pageOf()));

      await useCase.execute(testAddress, testCurrencyId);

      expect(mockCalDataSource.getCurrencyInformation).toHaveBeenCalledWith(
        testCurrencyId,
      );
    });

    it("returns an empty transactions array when the page is empty", async () => {
      mockDataSource.getTransactions.mockResolvedValue(Right(pageOf()));

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual({
        transactions: [],
        nextPageToken: undefined,
      });
    });

    it("passes through nextPageToken from the data source", async () => {
      mockDataSource.getTransactions.mockResolvedValue(
        Right({
          items: [],
          nextPageToken: "next-page-token",
        } satisfies TransactionHistoryPage),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.unsafeCoerce()).toHaveProperty(
        "nextPageToken",
        "next-page-token",
      );
    });
  });

  describe("error propagation", () => {
    it("propagates Left from the data source", async () => {
      const error = new TransactionHistoryError("Network error", {
        address: testAddress,
        currencyId: testCurrencyId,
      });
      mockDataSource.getTransactions.mockResolvedValue(Left(error));

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.isLeft()).toBe(true);
      expect(result.extract()).toBe(error);
    });

    it("still produces transactions when CAL currency info fails (uses fallback native info)", async () => {
      mockCalDataSource.getCurrencyInformation.mockResolvedValueOnce(
        Left(new Error("CAL down")),
      );
      mockDataSource.getTransactions.mockResolvedValue(
        Right(
          pageOf(
            makeEntry({
              senders: [testAddress],
              value: "1000000000000000000",
            }),
          ),
        ),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.isRight()).toBe(true);
      expect(result.unsafeCoerce().transactions[0]).toMatchObject({
        ticker: "ETHEREUM",
        currencyName: "ethereum",
        ledgerId: "ethereum",
      });
    });
  });

  describe("address normalization", () => {
    it("matches senders/recipients case-insensitively by lowercasing the input address", async () => {
      mockDataSource.getTransactions.mockResolvedValue(
        Right(
          pageOf(
            makeEntry({
              senders: [testAddress],
              recipients: [],
              value: "1000000000000000000",
            }),
          ),
        ),
      );

      const result = await useCase.execute(
        testAddress.toUpperCase(),
        testCurrencyId,
      );

      expect(result.unsafeCoerce().transactions[0]).toMatchObject({
        direction: "sent",
      });
    });
  });

  describe("asset resolution via CAL", () => {
    it("uses ERC20 token info from CAL when entry.asset.isNative is false", async () => {
      const tokenAsset: TransactionHistoryEntryAsset = {
        isNative: false,
        contractAddress: "0xcontract",
      };
      mockDataSource.getTransactions.mockResolvedValue(
        Right(
          pageOf(
            makeEntry({
              senders: [testAddress],
              value: "5000000",
              asset: tokenAsset,
            }),
          ),
        ),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.unsafeCoerce().transactions[0]).toMatchObject({
        ticker: "USDC",
        currencyName: "USD Coin",
        ledgerId: "ethereum/erc20/usdc",
      });
    });

    it("caches CAL token info across calls for the same contract", async () => {
      const tokenAsset: TransactionHistoryEntryAsset = {
        isNative: false,
        contractAddress: "0xcontract",
      };
      mockDataSource.getTransactions.mockResolvedValue(
        Right(
          pageOf(
            makeEntry({
              senders: [testAddress],
              value: "1000000",
              asset: tokenAsset,
            }),
          ),
        ),
      );

      await useCase.execute(testAddress, testCurrencyId);
      await useCase.execute(testAddress, testCurrencyId);

      expect(mockCalDataSource.getTokenInformation).toHaveBeenCalledTimes(1);
    });

    it("falls back to unknown-token defaults when CAL token lookup fails", async () => {
      mockCalDataSource.getTokenInformation.mockResolvedValueOnce(
        Left(new Error("CAL down")),
      );
      mockDataSource.getTransactions.mockResolvedValue(
        Right(
          pageOf(
            makeEntry({
              senders: [testAddress],
              value: "5000000",
              asset: { isNative: false, contractAddress: "0xunknown" },
            }),
          ),
        ),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.unsafeCoerce().transactions[0]).toMatchObject({
        ticker: "???",
        currencyName: "Unknown Token",
        ledgerId: "ethereum/erc20/unknown",
      });
    });

    it("uses native asset info when entry.asset.isNative is true", async () => {
      mockDataSource.getTransactions.mockResolvedValue(
        Right(
          pageOf(
            makeEntry({
              senders: ["0xsender"],
              recipients: [testAddress],
              direction: "in",
              value: "1000000000000000000",
              asset: { isNative: true },
            }),
          ),
        ),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.unsafeCoerce().transactions[0]).toMatchObject({
        ticker: "ETH",
        currencyName: "Ethereum",
        ledgerId: "ethereum",
      });
    });
  });

  describe("explorer URL", () => {
    it("attaches the explorerUrl built from the CAL template", async () => {
      mockDataSource.getTransactions.mockResolvedValue(
        Right(
          pageOf(
            makeEntry({
              hash: "0xabc",
              senders: [testAddress],
              value: "1",
            }),
          ),
        ),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.unsafeCoerce().transactions[0]).toMatchObject({
        explorerUrl: "https://etherscan.io/tx/0xabc",
      });
    });

    it("leaves explorerUrl undefined when CAL did not provide a template", async () => {
      mockCalDataSource.getCurrencyInformation.mockResolvedValueOnce(
        Right({
          id: "ethereum",
          name: "Ethereum",
          ticker: "ETH",
          decimals: 18,
        }),
      );
      mockDataSource.getTransactions.mockResolvedValue(
        Right(
          pageOf(
            makeEntry({
              hash: "0xabc",
              senders: [testAddress],
              value: "1",
            }),
          ),
        ),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.unsafeCoerce().transactions[0].explorerUrl).toBeUndefined();
    });
  });
});
