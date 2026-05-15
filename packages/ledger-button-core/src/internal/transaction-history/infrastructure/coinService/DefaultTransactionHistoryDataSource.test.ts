import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "../../../config/model/config.js";
import type { NetworkService } from "../../../network/NetworkService.js";
import { TransactionHistoryError } from "../../domain/TransactionHistoryError.js";
import {
  CoinServiceAccountOperationDto,
  CoinServiceAccountOperationsResponseDto,
} from "./coinServiceDtos.js";
import { DefaultTransactionHistoryDataSource } from "./DefaultTransactionHistoryDataSource.js";

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

function makeDto(
  overrides: Partial<CoinServiceAccountOperationDto> & {
    txOverrides?: Partial<CoinServiceAccountOperationDto["tx"]>;
  } = {},
): CoinServiceAccountOperationDto {
  const { txOverrides, ...opOverrides } = overrides;
  const baseTx: CoinServiceAccountOperationDto["tx"] = {
    hash: "0xabc123",
    fees: "0",
    block: {
      height: 19_000_000,
      time: "2024-01-15T10:30:00Z",
    },
    failed: false,
  };
  return {
    id: "js:2:ethereum:0xowner:-0xabc123-OUT-i0",
    type: "OUT",
    value: "0",
    senders: [],
    recipients: [],
    asset: { type: "native" },
    ...opOverrides,
    tx: {
      ...baseTx,
      ...(txOverrides ?? {}),
    },
  };
}

describe("DefaultTransactionHistoryDataSource", () => {
  let dataSource: DefaultTransactionHistoryDataSource;
  let mockNetworkService: NetworkService<unknown>;
  let mockConfig: Config;
  let mockLoggerFactory: ReturnType<typeof createMockLoggerFactory>;

  const mockCoinServiceUrl = "https://coin-service.api.ledger.com";
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const testCurrencyId = "ethereum";

  beforeEach(() => {
    mockNetworkService = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as NetworkService<unknown>;

    mockConfig = {
      getCoinServiceUrl: vi.fn().mockReturnValue(mockCoinServiceUrl),
    } as unknown as Config;

    mockLoggerFactory = createMockLoggerFactory();

    dataSource = new DefaultTransactionHistoryDataSource(
      mockNetworkService,
      mockConfig,
      mockLoggerFactory,
    );
  });

  describe("currencyId resolution", () => {
    it("should hit the network for a supported currencyId", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right({ items: [makeDto()] }),
      );

      await dataSource.getTransactions(testAddress, testCurrencyId);

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockCoinServiceUrl}/v1/${testCurrencyId}/account/${testAddress}/operations?order=desc`,
      );
    });

    it("should return Left without hitting the network for an unsupported currencyId", async () => {
      const result = await dataSource.getTransactions(
        testAddress,
        "not-a-real-chain",
      );

      expect(mockNetworkService.get).not.toHaveBeenCalled();
      expect(result.isLeft()).toBe(true);
      const error = result.extract() as TransactionHistoryError;
      expect(error).toBeInstanceOf(TransactionHistoryError);
      expect(error.context).toEqual({
        address: testAddress,
        currencyId: "not-a-real-chain",
      });
    });

    it("should resolve different supported currencyIds to their slug", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right({ items: [makeDto()] }),
      );

      await dataSource.getTransactions(testAddress, "polygon");

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        expect.stringContaining("/v1/polygon/account/"),
      );
    });
  });

  describe("query params", () => {
    beforeEach(() => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right({ items: [makeDto()] }),
      );
    });

    it("should send order=desc by default", async () => {
      await dataSource.getTransactions(testAddress, testCurrencyId);

      const calledUrl = vi.mocked(mockNetworkService.get).mock.calls[0]?.[0];
      expect(calledUrl).toContain("order=desc");
    });

    it("should include cursor when pageToken is provided", async () => {
      await dataSource.getTransactions(testAddress, testCurrencyId, {
        pageToken: "next-page-token-123",
      });

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        expect.stringContaining("cursor=next-page-token-123"),
      );
    });

    it("should omit cursor when pageToken is absent", async () => {
      await dataSource.getTransactions(testAddress, testCurrencyId);

      const calledUrl = vi.mocked(mockNetworkService.get).mock.calls[0]?.[0];
      expect(calledUrl).not.toContain("cursor=");
    });

    it("should not include the deprecated limit query param", async () => {
      await dataSource.getTransactions(testAddress, testCurrencyId);

      const calledUrl = vi.mocked(mockNetworkService.get).mock.calls[0]?.[0];
      expect(calledUrl).not.toContain("limit=");
    });
  });

  describe("DTO to TransactionHistoryEntry mapping", () => {
    async function fetchSingleEntry(dto: CoinServiceAccountOperationDto) {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right({ items: [dto] }),
      );
      const result = await dataSource.getTransactions(
        testAddress,
        testCurrencyId,
      );
      expect(result.isRight()).toBe(true);
      const page = result.unsafeCoerce();
      expect(page.items).toHaveLength(1);
      const [entry] = page.items;
      if (!entry) {
        throw new Error("expected the page to contain exactly one entry");
      }
      return entry;
    }

    it("should surface tx.hash at the top level", async () => {
      const entry = await fetchSingleEntry(
        makeDto({ txOverrides: { hash: "0xdeadbeef" } }),
      );
      expect(entry.hash).toBe("0xdeadbeef");
    });

    it("should resolve value from details.assetAmount when non-zero", async () => {
      const entry = await fetchSingleEntry(
        makeDto({ value: "100", details: { assetAmount: "999" } }),
      );
      expect(entry.value).toBe("999");
    });

    it("should fall back to top-level value when details.assetAmount is missing", async () => {
      const entry = await fetchSingleEntry(makeDto({ value: "100" }));
      expect(entry.value).toBe("100");
    });

    it("should fall back to top-level value when details.assetAmount is '0'", async () => {
      const entry = await fetchSingleEntry(
        makeDto({ value: "100", details: { assetAmount: "0" } }),
      );
      expect(entry.value).toBe("100");
    });

    it("should prefer block.time for timestamp", async () => {
      const entry = await fetchSingleEntry(
        makeDto({
          txOverrides: {
            block: { height: 1, time: "2024-05-01T00:00:00Z" },
            date: "2030-01-01T00:00:00Z",
          },
        }),
      );
      expect(entry.timestamp).toBe("2024-05-01T00:00:00Z");
    });

    it("should fall back to tx.date when block.time is missing", async () => {
      const entry = await fetchSingleEntry(
        makeDto({
          txOverrides: {
            block: { height: 1 },
            date: "2024-06-01T00:00:00Z",
          },
        }),
      );
      expect(entry.timestamp).toBe("2024-06-01T00:00:00Z");
    });

    it("should fall back to epoch ISO when both block.time and date are missing", async () => {
      const entry = await fetchSingleEntry(
        makeDto({
          txOverrides: {
            block: { height: 1 },
          },
        }),
      );
      expect(entry.timestamp).toBe(new Date(0).toISOString());
    });

    it("should set isFeeOnlyOperation=true when id ends with -FEES", async () => {
      const entry = await fetchSingleEntry(
        makeDto({ id: "js:2:ethereum:0xabc:-0xfailed-FEES" }),
      );
      expect(entry.isFeeOnlyOperation).toBe(true);
    });

    it("should set isFeeOnlyOperation=false otherwise", async () => {
      const entry = await fetchSingleEntry(
        makeDto({ id: "js:2:ethereum:0xabc:-0xabc123-OUT-i0" }),
      );
      expect(entry.isFeeOnlyOperation).toBe(false);
    });

    it("should expose native asset as { isNative: true }", async () => {
      const entry = await fetchSingleEntry(
        makeDto({ asset: { type: "native" } }),
      );
      expect(entry.asset).toEqual({ isNative: true });
    });

    it("should expose ERC-20 asset with contractAddress", async () => {
      const entry = await fetchSingleEntry(
        makeDto({
          asset: { type: "erc20", assetReference: "0xUSDC" },
        }),
      );
      expect(entry.asset).toEqual({
        isNative: false,
        contractAddress: "0xUSDC",
      });
    });

    it("should treat asset without reference as native", async () => {
      const entry = await fetchSingleEntry(
        makeDto({ asset: { type: "erc20" } }),
      );
      expect(entry.asset).toEqual({ isNative: true });
    });

    it("should normalize type 'OUT' to direction='sent'", async () => {
      const entry = await fetchSingleEntry(makeDto({ type: "OUT" }));
      expect(entry.direction).toBe("sent");
    });

    it("should normalize type 'IN' to direction='received'", async () => {
      const entry = await fetchSingleEntry(makeDto({ type: "IN" }));
      expect(entry.direction).toBe("received");
    });

    it("should leave direction undefined for unknown types", async () => {
      const entry = await fetchSingleEntry(makeDto({ type: "SOMETHING_ELSE" }));
      expect(entry.direction).toBeUndefined();
    });

    it("should lowercase senders, recipients, and fee.payer", async () => {
      const entry = await fetchSingleEntry(
        makeDto({
          senders: ["0xAAA"],
          recipients: ["0xBBB", "0xCCC"],
          txOverrides: {
            fees: "100",
            feesPayer: "0xPAYER",
          },
        }),
      );
      expect(entry.senders).toEqual(["0xaaa"]);
      expect(entry.recipients).toEqual(["0xbbb", "0xccc"]);
      expect(entry.fee?.payer).toBe("0xpayer");
    });

    it("should set fee to undefined when fees == '0'", async () => {
      const entry = await fetchSingleEntry(
        makeDto({ txOverrides: { fees: "0" } }),
      );
      expect(entry.fee).toBeUndefined();
    });

    it("should expose fee with amount (and payer if present) when fees is non-zero", async () => {
      const entry = await fetchSingleEntry(
        makeDto({
          txOverrides: { fees: "210000000000000", feesPayer: "0xpayer" },
        }),
      );
      expect(entry.fee).toEqual({
        amount: "210000000000000",
        payer: "0xpayer",
      });
    });

    it("should expose fee without payer when feesPayer is absent", async () => {
      const entry = await fetchSingleEntry(
        makeDto({ txOverrides: { fees: "210000000000000" } }),
      );
      expect(entry.fee).toEqual({ amount: "210000000000000" });
    });

    it("should set failed from tx.failed", async () => {
      const failedEntry = await fetchSingleEntry(
        makeDto({ txOverrides: { failed: true } }),
      );
      expect(failedEntry.failed).toBe(true);

      const okEntry = await fetchSingleEntry(
        makeDto({ txOverrides: { failed: false } }),
      );
      expect(okEntry.failed).toBe(false);
    });

    it("should surface tx.block.height as blockHeight", async () => {
      const entry = await fetchSingleEntry(
        makeDto({ txOverrides: { block: { height: 12345 } } }),
      );
      expect(entry.blockHeight).toBe(12345);
    });
  });

  describe("page mapping", () => {
    it("should rename next to nextPageToken", async () => {
      const dto: CoinServiceAccountOperationsResponseDto = {
        items: [makeDto()],
        next: "pagination-token-abc",
      };
      vi.mocked(mockNetworkService.get).mockResolvedValue(Right(dto));

      const result = await dataSource.getTransactions(
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      expect(result.unsafeCoerce().nextPageToken).toBe("pagination-token-abc");
    });

    it("should expose nextPageToken as undefined when next is missing", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right({ items: [makeDto()] }),
      );

      const result = await dataSource.getTransactions(
        testAddress,
        testCurrencyId,
      );

      expect(result.unsafeCoerce().nextPageToken).toBeUndefined();
    });

    it("should return an empty items array when no operations are returned", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(Right({ items: [] }));

      const result = await dataSource.getTransactions(
        testAddress,
        testCurrencyId,
      );

      expect(result.unsafeCoerce().items).toHaveLength(0);
    });
  });

  describe("dropping operations without hash", () => {
    it("should drop operations whose tx.hash is missing or empty", async () => {
      const validOp = makeDto({
        id: "with-hash",
        txOverrides: { hash: "0xvalid" },
      });
      const emptyHashOp = makeDto({
        id: "empty-hash",
        txOverrides: { hash: "" },
      });
      const missingHashOp = {
        ...makeDto({ id: "missing-hash" }),
        tx: { ...makeDto().tx, hash: undefined },
      } as unknown as CoinServiceAccountOperationDto;

      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right({
          items: [validOp, emptyHashOp, missingHashOp],
          next: "page-2",
        }),
      );

      const result = await dataSource.getTransactions(
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      const page = result.unsafeCoerce();
      expect(page.items).toHaveLength(1);
      expect(page.items[0]?.hash).toBe("0xvalid");
      expect(page.nextPageToken).toBe("page-2");

      const logger = mockLoggerFactory.mock.results[0]?.value as ReturnType<
        typeof createMockLogger
      >;
      expect(logger.warn).toHaveBeenCalledWith(
        "Dropped Coin Service operations without a tx hash",
        { received: 3, kept: 1 },
      );
    });

    it("should not log when every operation has a hash", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right({ items: [makeDto()] }),
      );

      await dataSource.getTransactions(testAddress, testCurrencyId);

      const logger = mockLoggerFactory.mock.results[0]?.value as ReturnType<
        typeof createMockLogger
      >;
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should return Left(TransactionHistoryError) when the network call fails", async () => {
      const networkError = new Error("Network request failed");
      vi.mocked(mockNetworkService.get).mockResolvedValue(Left(networkError));

      const result = await dataSource.getTransactions(
        testAddress,
        testCurrencyId,
      );

      expect(result.isLeft()).toBe(true);
      const error = result.extract() as TransactionHistoryError;
      expect(error.message).toBe(
        `Failed to fetch transaction history for ${testAddress}`,
      );
      expect(error.context).toEqual({
        address: testAddress,
        currencyId: testCurrencyId,
        originalError: "Network request failed",
      });
    });
  });
});
