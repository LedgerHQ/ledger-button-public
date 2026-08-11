import { Left, Maybe, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CalDataSource } from "@internal/balance/datasource/cal/CalDataSource.js";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager.js";

import type { TransactionHistoryDataSource } from "../datasource/coinService/TransactionHistoryDataSource.js";
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

function createMockBlockchainProviderManager(): BlockchainProviderManager {
  return {
    init: vi.fn(),
    setSelectedAccounts: vi.fn(),
    setNetwork: vi.fn(),
    resolveBlockchainFamily: vi.fn().mockReturnValue(Maybe.empty()),
    resolveNetwork: vi.fn().mockReturnValue(Maybe.empty()),
    resolveCurrencyId: vi.fn().mockReturnValue(Maybe.empty()),
    getNativeDecimals: vi
      .fn()
      .mockImplementation((currencyId: string) =>
        currencyId === "ethereum" ? Maybe.of(18) : Maybe.empty(),
      ),
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
    direction: "sent",
    isFeeOnlyOperation: false,
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
      createMockBlockchainProviderManager(),
    );

    vi.clearAllMocks();
  });

  describe("data source + CAL composition", () => {
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
        transactionExplorerUrlTemplate: "https://etherscan.io/tx/${hash}",
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

    it("still produces transactions when currency info fails (uses fallback native info)", async () => {
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
      expect(result.unsafeCoerce().transactions[0]?.asset).toEqual({
        ledgerId: "ethereum",
        name: "ethereum",
        ticker: "ETHEREUM",
        decimals: 18,
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

      expect(result.unsafeCoerce().transactions[0]?.asset).toEqual({
        ledgerId: "ethereum/erc20/usdc",
        name: "USD Coin",
        ticker: "USDC",
        decimals: 6,
      });
    });

    it("falls back to unknown-token defaults when the CAL token lookup fails", async () => {
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

      expect(result.unsafeCoerce().transactions[0]?.asset).toEqual({
        ledgerId: "ethereum/erc20/unknown",
        name: undefined,
        ticker: "???",
        decimals: 18,
      });
    });

    it("uses native asset info when entry.asset.isNative is true", async () => {
      mockDataSource.getTransactions.mockResolvedValue(
        Right(
          pageOf(
            makeEntry({
              senders: ["0xsender"],
              recipients: [testAddress],
              direction: "received",
              value: "1000000000000000000",
              asset: { isNative: true },
            }),
          ),
        ),
      );

      const result = await useCase.execute(testAddress, testCurrencyId);

      expect(result.unsafeCoerce().transactions[0]?.asset).toEqual({
        ledgerId: "ethereum",
        name: "Ethereum",
        ticker: "ETH",
        decimals: 18,
      });
    });
  });

  describe("explorer URL template", () => {
    it("exposes the explorerUrlTemplate on the result when CAL provides one", async () => {
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

      expect(result.unsafeCoerce().transactionExplorerUrlTemplate).toBe(
        "https://etherscan.io/tx/${hash}",
      );
    });

    it("leaves transactionExplorerUrlTemplate undefined when CAL did not return one", async () => {
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

      expect(
        result.unsafeCoerce().transactionExplorerUrlTemplate,
      ).toBeUndefined();
    });
  });
});
