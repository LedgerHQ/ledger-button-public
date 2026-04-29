import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "../../config/model/config.js";
import type { NetworkService } from "../../network/NetworkService.js";
import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import type {
  AlpacaOperation,
  AlpacaOperationsResponse,
} from "../model/transactionHistoryTypes.js";
import { DefaultTransactionHistoryDataSource } from "./DefaultTransactionHistoryDataSource.js";

describe("DefaultTransactionHistoryDataSource", () => {
  let dataSource: DefaultTransactionHistoryDataSource;
  let mockNetworkService: NetworkService<unknown>;
  let mockConfig: Config;

  const mockAlpacaUrl = "https://alpaca.api.ledger.com";
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const testNetwork = "ethereum";

  const sampleOperation: AlpacaOperation = {
    id: "js:2:ethereum:0xabc:-0xabc123-OUT-i0",
    type: "OUT",
    value: "1000000000000000000",
    senders: [testAddress],
    recipients: ["0xrecipient"],
    asset: { type: "native" },
    tx: {
      hash: "0xabc123",
      fees: "210000000000000",
      block: {
        height: 19_000_000,
        hash: "0xblock",
        time: "2024-01-15T10:30:00Z",
      },
      date: "2024-01-15T10:30:00Z",
      failed: false,
      feesPayer: testAddress,
    },
  };

  const mockAlpacaResponse: AlpacaOperationsResponse = {
    items: [sampleOperation],
  };

  beforeEach(() => {
    mockNetworkService = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as NetworkService<unknown>;

    mockConfig = {
      getAlpacaUrl: vi.fn().mockReturnValue(mockAlpacaUrl),
    } as unknown as Config;

    dataSource = new DefaultTransactionHistoryDataSource(
      mockNetworkService,
      mockConfig,
    );
  });

  describe("getTransactions", () => {
    it("should call the Alpaca operations endpoint with order=desc by default", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockAlpacaResponse),
      );

      await dataSource.getTransactions(testNetwork, testAddress);

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockAlpacaUrl}/v1/${testNetwork}/account/${testAddress}/operations?order=desc`,
      );
    });

    it("should not include the deprecated limit query param", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockAlpacaResponse),
      );

      await dataSource.getTransactions(testNetwork, testAddress);

      const calledUrl = vi.mocked(mockNetworkService.get).mock.calls[0]?.[0];
      expect(calledUrl).not.toContain("limit=");
    });

    it("should include cursor when pageToken is provided", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockAlpacaResponse),
      );

      await dataSource.getTransactions(testNetwork, testAddress, {
        pageToken: "next-page-token-123",
      });

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        expect.stringContaining("cursor=next-page-token-123"),
      );
    });

    it("should not include cursor when pageToken is absent", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockAlpacaResponse),
      );

      await dataSource.getTransactions(testNetwork, testAddress);

      const calledUrl = vi.mocked(mockNetworkService.get).mock.calls[0]?.[0];
      expect(calledUrl).not.toContain("cursor=");
    });

    it("should return Right with the Alpaca response on success", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockAlpacaResponse),
      );

      const result = await dataSource.getTransactions(
        testNetwork,
        testAddress,
      );

      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual(mockAlpacaResponse);
    });

    it("should return Left with TransactionHistoryError when network service fails", async () => {
      const networkError = new Error("Network request failed");
      vi.mocked(mockNetworkService.get).mockResolvedValue(Left(networkError));

      const result = await dataSource.getTransactions(
        testNetwork,
        testAddress,
      );

      expect(result.isLeft()).toBe(true);
      const error = result.extract() as TransactionHistoryError;
      expect(error.message).toBe(
        `Failed to fetch transaction history for ${testAddress}`,
      );
      expect(error.context).toEqual({
        address: testAddress,
        network: testNetwork,
        originalError: "Network request failed",
      });
    });

    it("should handle different network slugs correctly", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockAlpacaResponse),
      );

      await dataSource.getTransactions("polygon", testAddress);

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        expect.stringContaining("/v1/polygon/account/"),
      );
    });

    it("should return response with next cursor for pagination", async () => {
      const paginatedResponse: AlpacaOperationsResponse = {
        items: mockAlpacaResponse.items,
        next: "pagination-token-abc",
      };
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(paginatedResponse),
      );

      const result = await dataSource.getTransactions(
        testNetwork,
        testAddress,
      );

      expect(result.isRight()).toBe(true);
      const response = result.extract() as AlpacaOperationsResponse;
      expect(response.next).toBe("pagination-token-abc");
    });

    it("should return empty items array when no operations exist", async () => {
      const emptyResponse: AlpacaOperationsResponse = {
        items: [],
      };
      vi.mocked(mockNetworkService.get).mockResolvedValue(Right(emptyResponse));

      const result = await dataSource.getTransactions(
        testNetwork,
        testAddress,
      );

      expect(result.isRight()).toBe(true);
      const response = result.extract() as AlpacaOperationsResponse;
      expect(response.items).toHaveLength(0);
    });

    it("should pass through nested tx, asset and details fields untouched", async () => {
      const enrichedResponse: AlpacaOperationsResponse = {
        items: [
          {
            id: "js:2:ethereum:0xabc:-0xfailed-FEES",
            type: "OUT",
            value: "0",
            senders: [testAddress],
            recipients: ["0xrouter"],
            asset: { type: "native" },
            tx: {
              hash: "0xfailed",
              fees: "210000000000000",
              block: {
                height: 19_000_000,
                hash: "0xblock",
                time: "2024-01-15T10:30:00Z",
              },
              failed: true,
              feesPayer: testAddress,
            },
            details: {
              sequence: "42",
            },
          },
        ],
      };
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(enrichedResponse),
      );

      const result = await dataSource.getTransactions(
        testNetwork,
        testAddress,
      );

      expect(result.isRight()).toBe(true);
      const response = result.extract() as AlpacaOperationsResponse;
      expect(response.items[0]).toMatchObject({
        id: "js:2:ethereum:0xabc:-0xfailed-FEES",
        type: "OUT",
        tx: {
          hash: "0xfailed",
          failed: true,
          fees: "210000000000000",
          block: { height: 19_000_000 },
        },
        details: { sequence: "42" },
      });
    });
  });
});
