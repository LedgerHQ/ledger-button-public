import { Either, Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "../../../config/model/config.js";
import type { NetworkService } from "../../../network/NetworkService.js";
import type {
  CounterValuedResponse,
  CounterValueResult,
} from "./counterValueTypes.js";
import { DefaultCounterValueDataSource } from "./DefaultCounterValueDataSource.js";

const createMockResponse = (
  rates: Record<string, number>,
): CounterValuedResponse => rates;

const expectSuccessfulResult = (
  result: Either<Error, CounterValueResult[]>,
  expected: CounterValueResult[],
) => {
  expect(result.isRight()).toBe(true);
  if (result.isRight()) {
    expect(result.extract()).toEqual(expected);
  }
};

const MOCK_ETH_USD_RATE = 3200.5;
const MOCK_ETH_EUR_RATE = 2900.0;
const MOCK_ETH_ERC20_RATE = 1.0;

describe("DefaultCounterValueDataSource", () => {
  let dataSource: DefaultCounterValueDataSource;
  let mockNetworkService: NetworkService<unknown>;
  let mockConfig: Config;

  const mockCounterValueUrl = "https://countervalue.api.test";

  beforeEach(() => {
    mockNetworkService = {
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as NetworkService<unknown>;

    mockConfig = {
      getCounterValueUrl: vi.fn().mockReturnValue(mockCounterValueUrl),
    } as unknown as Config;

    dataSource = new DefaultCounterValueDataSource(
      mockNetworkService,
      mockConfig,
    );
  });

  describe("getCounterValues", () => {
    it("should return empty array when ledgerIds is empty", async () => {
      const result = await dataSource.getCounterValues([], "usd");

      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual([]);
      expect(mockNetworkService.get).not.toHaveBeenCalled();
    });

    it("should successfully fetch counter values for single ledgerId", async () => {
      const mockResponse = createMockResponse({
        ethereum: MOCK_ETH_USD_RATE,
      });

      vi.mocked(mockNetworkService.get).mockResolvedValue(Right(mockResponse));

      const result = await dataSource.getCounterValues(["ethereum"], "usd");

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockCounterValueUrl}/v3/spot/simple?froms=ethereum&to=usd`,
      );

      expectSuccessfulResult(result, [
        { ledgerId: "ethereum", rate: MOCK_ETH_USD_RATE },
      ]);
    });

    it("should successfully fetch counter values for multiple ledgerIds", async () => {
      const mockResponse = createMockResponse({
        ethereum: MOCK_ETH_USD_RATE,
        "ethereum/erc20/usd_tether__erc20_": MOCK_ETH_ERC20_RATE,
      });

      vi.mocked(mockNetworkService.get).mockResolvedValue(Right(mockResponse));

      const result = await dataSource.getCounterValues(
        ["ethereum", "ethereum/erc20/usd_tether__erc20_"],
        "usd",
      );

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockCounterValueUrl}/v3/spot/simple?froms=ethereum%2Cethereum%2Ferc20%2Fusd_tether__erc20_&to=usd`,
      );

      expectSuccessfulResult(result, [
        { ledgerId: "ethereum", rate: MOCK_ETH_USD_RATE },
        {
          ledgerId: "ethereum/erc20/usd_tether__erc20_",
          rate: MOCK_ETH_ERC20_RATE,
        },
      ]);
    });

    it("should return rate 0 for ledgerIds not found in response", async () => {
      const mockResponse = createMockResponse({
        ethereum: MOCK_ETH_ERC20_RATE,
      });

      vi.mocked(mockNetworkService.get).mockResolvedValue(Right(mockResponse));

      const result = await dataSource.getCounterValues(
        ["ethereum", "unknown-token"],
        "usd",
      );

      expectSuccessfulResult(result, [
        { ledgerId: "ethereum", rate: MOCK_ETH_ERC20_RATE },
        { ledgerId: "unknown-token", rate: 0 },
      ]);
    });

    it("should return rate 0 when rates object is undefined", async () => {
      const mockResponse = {} as CounterValuedResponse;

      vi.mocked(mockNetworkService.get).mockResolvedValue(Right(mockResponse));

      const result = await dataSource.getCounterValues(["ethereum"], "usd");

      expectSuccessfulResult(result, [{ ledgerId: "ethereum", rate: 0 }]);
    });

    it("should return Left when network service returns Left", async () => {
      const networkError = new Error("Network request failed");
      vi.mocked(mockNetworkService.get).mockResolvedValue(Left(networkError));

      const result = await dataSource.getCounterValues(["ethereum"], "usd");

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.extract() as Error;
        expect(error.message).toBe("Failed to fetch counter values");
      }
    });

    it("should use different target currencies", async () => {
      const mockResponse = createMockResponse({
        ethereum: MOCK_ETH_EUR_RATE,
      });

      vi.mocked(mockNetworkService.get).mockResolvedValue(Right(mockResponse));

      const result = await dataSource.getCounterValues(["ethereum"], "eur");

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockCounterValueUrl}/v3/spot/simple?froms=ethereum&to=eur`,
      );

      expectSuccessfulResult(result, [
        { ledgerId: "ethereum", rate: MOCK_ETH_EUR_RATE },
      ]);
    });
  });

  describe("getHistoricalRates", () => {
    it("should return empty object when startDate is after endDate", async () => {
      const result = await dataSource.getHistoricalRates(
        "ethereum",
        "usd",
        "2024-01-15",
        "2024-01-10",
      );

      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual({});
      expect(mockNetworkService.get).not.toHaveBeenCalled();
    });

    it("should successfully fetch historical rates for date range", async () => {
      const mockResponse: Record<string, number> = {
        "2024-01-10": 2500,
        "2024-01-11": 2550,
        "2024-01-12": 2600,
      };
      vi.mocked(mockNetworkService.get).mockResolvedValue(Right(mockResponse));

      const result = await dataSource.getHistoricalRates(
        "ethereum",
        "usd",
        "2024-01-10",
        "2024-01-12",
      );

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockCounterValueUrl}/v3/historical/daily/simple?from=ethereum&to=usd&start=2024-01-10&end=2024-01-12`,
      );
      expect(result.isRight()).toBe(true);
      expect(result.extract()).toEqual(mockResponse);
    });

    it("should return Left when network service returns Left", async () => {
      const networkError = new Error("Network request failed");
      vi.mocked(mockNetworkService.get).mockResolvedValue(Left(networkError));

      const result = await dataSource.getHistoricalRates(
        "ethereum",
        "usd",
        "2024-01-10",
        "2024-01-12",
      );

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.extract() as Error;
        expect(error.message).toBe("Failed to fetch historical counter values");
      }
    });
  });
});
