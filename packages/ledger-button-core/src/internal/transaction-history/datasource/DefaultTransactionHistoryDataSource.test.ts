import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "../../config/model/config.js";
import type { NetworkService } from "../../network/NetworkService.js";
import { TransactionHistoryError } from "../model/TransactionHistoryError.js";
import type { AlpacaOperationsResponse } from "../model/transactionHistoryTypes.js";
import { DefaultTransactionHistoryDataSource } from "./DefaultTransactionHistoryDataSource.js";

describe("DefaultTransactionHistoryDataSource", () => {
  let dataSource: DefaultTransactionHistoryDataSource;
  let mockNetworkService: NetworkService<unknown>;
  let mockConfig: Config;

  const mockAlpacaUrl = "https://alpaca.api.ledger.com";
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const testNetwork = "ethereum";

  const mockAlpacaResponse: AlpacaOperationsResponse = {
    data: [
      {
        hash: "0xabc123",
        type: "send",
        senders: [{ address: testAddress, amount: "1000000000000000000" }],
        recipients: [{ address: "0xrecipient", amount: "1000000000000000000" }],
        value: "1000000000000000000",
        asset: { type: "native" },
        date: "2024-01-15T10:30:00Z",
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
      getAlpacaUrl: vi.fn().mockReturnValue(mockAlpacaUrl),
    } as unknown as Config;

    dataSource = new DefaultTransactionHistoryDataSource(
      mockNetworkService,
      mockConfig,
    );
  });

  describe("getTransactions", () => {
    it("should call the Alpaca operations endpoint with default limit", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockAlpacaResponse),
      );

      await dataSource.getTransactions(testNetwork, testAddress);

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockAlpacaUrl}/v1/${testNetwork}/account/${testAddress}/operations?limit=20`,
      );
    });

    it("should use custom batch size as limit when provided", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockAlpacaResponse),
      );

      await dataSource.getTransactions(testNetwork, testAddress, {
        batchSize: 50,
      });

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        expect.stringContaining("limit=50"),
      );
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

    it("should include both limit and cursor when provided", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockAlpacaResponse),
      );

      await dataSource.getTransactions(testNetwork, testAddress, {
        batchSize: 100,
        pageToken: "my-token",
      });

      const calledUrl = vi.mocked(mockNetworkService.get).mock.calls[0]?.[0];
      expect(calledUrl).toContain("limit=100");
      expect(calledUrl).toContain("cursor=my-token");
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

    it("should return response with token for pagination", async () => {
      const paginatedResponse: AlpacaOperationsResponse = {
        data: mockAlpacaResponse.data,
        token: "pagination-token-abc",
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
      expect(response.token).toBe("pagination-token-abc");
    });

    it("should return empty operations array when no operations exist", async () => {
      const emptyResponse: AlpacaOperationsResponse = {
        data: [],
      };
      vi.mocked(mockNetworkService.get).mockResolvedValue(Right(emptyResponse));

      const result = await dataSource.getTransactions(
        testNetwork,
        testAddress,
      );

      expect(result.isRight()).toBe(true);
      const response = result.extract() as AlpacaOperationsResponse;
      expect(response.data).toHaveLength(0);
    });
  });
});
