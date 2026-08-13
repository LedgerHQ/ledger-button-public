import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "@internal/config/model/config.js";
import type { NetworkService } from "@internal/network/NetworkService.js";

import type {
  CoinServiceBalanceDto,
  CoinServiceFeeEstimationResponse,
  CoinServiceTransactionIntent,
} from "./coinServiceTypes.js";
import { DefaultCoinServiceDataSource } from "./DefaultCoinServiceDataSource.js";

describe("DefaultCoinServiceDataSource", () => {
  let dataSource: DefaultCoinServiceDataSource;
  let mockNetworkService: NetworkService<unknown>;
  let mockConfig: Config;

  const mockCoinServiceUrl = "https://api.coinService.test";
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const testCurrencyId = "ethereum";

  const mockNativeBalanceDto: CoinServiceBalanceDto = {
    value: "1000000000000000000",
    asset: {
      type: "native",
    },
  };

  const mockErc20BalanceDto: CoinServiceBalanceDto = {
    value: "5000000000000000000",
    asset: {
      type: "erc20",
      assetReference: "0xTokenAddress",
    },
  };

  beforeEach(() => {
    mockNetworkService = {
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as NetworkService<unknown>;

    mockConfig = {
      getCoinServiceUrl: vi.fn().mockReturnValue(mockCoinServiceUrl),
    } as unknown as Config;

    dataSource = new DefaultCoinServiceDataSource(
      mockNetworkService,
      mockConfig,
    );
  });

  describe("getBalanceForAddressAndCurrencyId", () => {
    it("should successfully call the CoinService API and transform balance data", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right([mockNativeBalanceDto, mockErc20BalanceDto]),
      );

      const result = await dataSource.getBalanceForAddressAndCurrencyId(
        testAddress,
        testCurrencyId,
      );

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockCoinServiceUrl}/v1/${testCurrencyId}/account/${testAddress}/balance`,
      );

      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const balances = result.extract();
        expect(balances).toHaveLength(2);
        expect(balances[0]).toEqual({
          value: mockNativeBalanceDto.value,
          type: mockNativeBalanceDto.asset.type,
          reference: undefined,
        });
        expect(balances[1]).toEqual({
          value: mockErc20BalanceDto.value,
          type: mockErc20BalanceDto.asset.type,
          reference: mockErc20BalanceDto.asset.assetReference,
        });
      }
    });

    it("should handle empty balance array", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(Right([]));

      const result = await dataSource.getBalanceForAddressAndCurrencyId(
        testAddress,
        testCurrencyId,
      );

      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual([]);
    });

    it("should return Left with error when network service returns Left", async () => {
      const networkError = new Error("Network request failed");
      vi.mocked(mockNetworkService.get).mockResolvedValue(Left(networkError));

      const result = await dataSource.getBalanceForAddressAndCurrencyId(
        testAddress,
        testCurrencyId,
      );

      expect(result.isLeft()).toBe(true);
      expect(result.extract() as Error).toBeInstanceOf(Error);
      expect((result.extract() as Error).message).toBe(
        "Failed to fetch balance from CoinService",
      );
    });

    it("should return Left with error when response is not an array", async () => {
      const invalidResponse = { invalid: "data" };
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(invalidResponse as unknown as CoinServiceBalanceDto[]),
      );

      const result = await dataSource.getBalanceForAddressAndCurrencyId(
        testAddress,
        testCurrencyId,
      );

      expect(result.isLeft()).toBe(true);
      expect((result.extract() as Error).message).toBe(
        "Failed to fetch balance from CoinService",
      );
    });
  });

  describe("estimateTransactionFee", () => {
    const mockNetwork = "ethereum";
    const mockIntent: CoinServiceTransactionIntent = {
      type: "send",
      sender: "0x1234567890abcdef1234567890abcdef12345678",
      recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
      amount: "1000000000000000000",
      asset: {
        type: "native",
      },
      feesStrategy: "medium",
      data: "0x",
    };

    const mockFeeResponse: CoinServiceFeeEstimationResponse = {
      value: "50000",
      parameters: {
        gasLimit: "0xc350",
        maxFeePerGas: "0x6fc23ac00",
        maxPriorityFeePerGas: "0x77359400",
        nextBaseFee: "0x3b9aca00",
        gasOptions: {},
      },
    };

    it("should successfully estimate transaction fee", async () => {
      vi.mocked(mockNetworkService.post).mockResolvedValue(
        Right(mockFeeResponse),
      );

      const result = await dataSource.estimateTransactionFee(
        mockNetwork,
        mockIntent,
      );

      expect(mockNetworkService.post).toHaveBeenCalledWith(
        `${mockCoinServiceUrl}/v1/${mockNetwork}/transaction/estimate`,
        JSON.stringify({ intent: mockIntent }),
      );

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const response = result.extract();
        expect(response).toEqual(mockFeeResponse);
      }
    });

    it("should return transformed error when network service fails", async () => {
      const networkError = new Error("Network request failed");
      vi.mocked(mockNetworkService.post).mockResolvedValue(Left(networkError));

      const result = await dataSource.estimateTransactionFee(
        mockNetwork,
        mockIntent,
      );

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.extract() as Error;
        expect(error.message).toBe(
          "Failed to estimate transaction fee for ethereum",
        );
        expect(error.name).toBe("CoinServiceFeeEstimationError");
      }
    });

    it("should handle different network names correctly", async () => {
      const arbitrumNetwork = "arbitrum";
      vi.mocked(mockNetworkService.post).mockResolvedValue(
        Right(mockFeeResponse),
      );

      await dataSource.estimateTransactionFee(arbitrumNetwork, mockIntent);

      expect(mockNetworkService.post).toHaveBeenCalledWith(
        `${mockCoinServiceUrl}/v1/${arbitrumNetwork}/transaction/estimate`,
        JSON.stringify({ intent: mockIntent }),
      );
    });

    it("should handle different transaction intents correctly", async () => {
      const contractIntent: CoinServiceTransactionIntent = {
        type: "contract_call",
        sender: "0x1234567890abcdef1234567890abcdef12345678",
        recipient: "0xcontract123456789abcdef123456789abcdef12",
        amount: "0",
        asset: {
          type: "erc20",
          assetReference: "0xtoken123456789abcdef123456789abcdef123",
        },
        feesStrategy: "fast",
        data: "0xa9059cbb000000000000000000000000recipient123456789abcdef123456789abcdef",
      };

      vi.mocked(mockNetworkService.post).mockResolvedValue(
        Right(mockFeeResponse),
      );

      await dataSource.estimateTransactionFee(mockNetwork, contractIntent);

      expect(mockNetworkService.post).toHaveBeenCalledWith(
        `${mockCoinServiceUrl}/v1/${mockNetwork}/transaction/estimate`,
        JSON.stringify({ intent: contractIntent }),
      );
    });
  });
});
