import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "../../../config/model/config.js";
import type { NetworkService } from "../../../network/NetworkService.js";
import type { AlpacaBalanceDto } from "./alpacaTypes.js";
import { DefaultAlpacaDataSource } from "./DefaultAlpacaDataSource.js";

describe("DefaultAlpacaDataSource", () => {
  let dataSource: DefaultAlpacaDataSource;
  let mockNetworkService: NetworkService<unknown>;
  let mockConfig: Config;

  const mockAlpacaUrl = "https://api.alpaca.test";
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const testCurrencyId = "ethereum";

  const mockNativeBalanceDto: AlpacaBalanceDto = {
    value: "1000000000000000000",
    asset: {
      type: "native",
    },
  };

  const mockErc20BalanceDto: AlpacaBalanceDto = {
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
      getAlpacaUrl: vi.fn().mockReturnValue(mockAlpacaUrl),
    } as unknown as Config;

    dataSource = new DefaultAlpacaDataSource(mockNetworkService, mockConfig);
  });

  describe("getBalanceForAddressAndCurrencyId", () => {
    it("should successfully call the Alpaca API and transform balance data", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right([mockNativeBalanceDto, mockErc20BalanceDto]),
      );

      const result = await dataSource.getBalanceForAddressAndCurrencyId(
        testAddress,
        testCurrencyId,
      );

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockAlpacaUrl}/v1/${testCurrencyId}/account/${testAddress}/balance`,
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
        "Failed to fetch balance from Alpaca",
      );
    });

    it("should return Left with error when response is not an array", async () => {
      const invalidResponse = { invalid: "data" };
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(invalidResponse as unknown as AlpacaBalanceDto[]),
      );

      const result = await dataSource.getBalanceForAddressAndCurrencyId(
        testAddress,
        testCurrencyId,
      );

      expect(result.isLeft()).toBe(true);
      expect((result.extract() as Error).message).toBe(
        "Failed to fetch balance from Alpaca",
      );
    });
  });
});
