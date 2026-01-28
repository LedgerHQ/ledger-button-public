import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "../../config/model/config.js";
import type { NetworkService } from "../../network/NetworkService.js";
import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import type { ExplorerResponse } from "../model/transactionHistoryTypes.js";
import { DefaultTransactionHistoryDataSource } from "./DefaultTransactionHistoryDataSource.js";

describe("DefaultTransactionHistoryDataSource", () => {
  let dataSource: DefaultTransactionHistoryDataSource;
  let mockNetworkService: NetworkService<unknown>;
  let mockConfig: Config;

  const mockExplorerUrl = "https://explorers.api.live.ledger.com";
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const testBlockchain = "eth";

  const mockExplorerResponse: ExplorerResponse = {
    truncated: false,
    txs: [
      {
        hash: "0xabc123",
        received_at: "2024-01-15T10:30:00Z",
        lock_time: 0,
        fees: "21000000000000",
        inputs: [
          {
            output_hash: "0x111",
            output_index: 0,
            input_index: 0,
            value: "1000000000000000000",
            address: testAddress,
            sequence: 0,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "900000000000000000",
            address: "0xrecipient",
            script_hex: "0x",
          },
        ],
        confirmations: 10,
      },
    ],
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
      getExplorerUrl: vi.fn().mockReturnValue(mockExplorerUrl),
    } as unknown as Config;

    dataSource = new DefaultTransactionHistoryDataSource(
      mockNetworkService,
      mockConfig,
    );
  });

  describe("getTransactions", () => {
    it("should call the explorer API with correct URL and default parameters", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockExplorerResponse),
      );

      await dataSource.getTransactions(testBlockchain, testAddress);

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockExplorerUrl}/blockchain/v4/${testBlockchain}/address/${testAddress}/txs?batch_size=20&order=descending&noinput=true&filtering=true`,
      );
    });

    it("should use custom batch size when provided", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockExplorerResponse),
      );

      await dataSource.getTransactions(testBlockchain, testAddress, {
        batchSize: 50,
      });

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        expect.stringContaining("batch_size=50"),
      );
    });

    it("should include page token when provided", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockExplorerResponse),
      );

      await dataSource.getTransactions(testBlockchain, testAddress, {
        pageToken: "next-page-token-123",
      });

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        expect.stringContaining("token=next-page-token-123"),
      );
    });

    it("should include both batch size and page token when provided", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockExplorerResponse),
      );

      await dataSource.getTransactions(testBlockchain, testAddress, {
        batchSize: 100,
        pageToken: "my-token",
      });

      const calledUrl = vi.mocked(mockNetworkService.get).mock.calls[0]?.[0];
      expect(calledUrl).toContain("batch_size=100");
      expect(calledUrl).toContain("token=my-token");
    });

    it("should return Right with explorer response on success", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockExplorerResponse),
      );

      const result = await dataSource.getTransactions(
        testBlockchain,
        testAddress,
      );

      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual(mockExplorerResponse);
    });

    it("should return Left with error when network service fails", async () => {
      const networkError = new Error("Network request failed");
      vi.mocked(mockNetworkService.get).mockResolvedValue(Left(networkError));

      const result = await dataSource.getTransactions(
        testBlockchain,
        testAddress,
      );

      expect(result.isLeft()).toBe(true);
      const error = result.extract() as TransactionHistoryError;
      expect(error.message).toBe(
        `Failed to fetch transaction history for ${testAddress}`,
      );
      expect(error.context).toEqual({
        address: testAddress,
        blockchain: testBlockchain,
        originalError: "Network request failed",
      });
    });

    it("should handle different blockchain names correctly", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockExplorerResponse),
      );

      await dataSource.getTransactions("btc", testAddress);

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        expect.stringContaining("/blockchain/v4/btc/address/"),
      );
    });

    it("should return response with truncated flag and token for pagination", async () => {
      const paginatedResponse: ExplorerResponse = {
        truncated: true,
        txs: mockExplorerResponse.txs,
        token: "pagination-token-abc",
      };
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(paginatedResponse),
      );

      const result = await dataSource.getTransactions(
        testBlockchain,
        testAddress,
      );

      expect(result.isRight()).toBe(true);
      const response = result.extract() as ExplorerResponse;
      expect(response.truncated).toBe(true);
      expect(response.token).toBe("pagination-token-abc");
    });

    it("should return empty transactions array when no transactions exist", async () => {
      const emptyResponse: ExplorerResponse = {
        truncated: false,
        txs: [],
      };
      vi.mocked(mockNetworkService.get).mockResolvedValue(Right(emptyResponse));

      const result = await dataSource.getTransactions(
        testBlockchain,
        testAddress,
      );

      expect(result.isRight()).toBe(true);
      const response = result.extract() as ExplorerResponse;
      expect(response.txs).toHaveLength(0);
    });

    it("should always include required query parameters", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockExplorerResponse),
      );

      await dataSource.getTransactions(testBlockchain, testAddress);

      const calledUrl = vi.mocked(mockNetworkService.get).mock.calls[0]?.[0];
      expect(calledUrl).toContain("order=descending");
      expect(calledUrl).toContain("noinput=true");
      expect(calledUrl).toContain("filtering=true");
    });
  });
});
