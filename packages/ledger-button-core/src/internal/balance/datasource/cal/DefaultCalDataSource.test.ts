import { Left, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "@internal/config/model/config";
import type { NetworkService } from "@internal/network/NetworkService";

import type { CalCoinResponse, CalTokenResponse } from "./calTypes";
import { DefaultCalDataSource } from "./DefaultCalDataSource";

describe("DefaultCalDataSource", () => {
  let dataSource: DefaultCalDataSource;
  let mockNetworkService: NetworkService<unknown>;
  let mockConfig: Config;

  const mockCalUrl = "https://api.cal.test";
  const testTokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const testCurrencyId = "ethereum";
  const explorerTemplate = "https://etherscan.io/tx/${hash}";

  beforeEach(() => {
    mockNetworkService = {
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as NetworkService<unknown>;

    mockConfig = {
      getCalUrl: vi.fn().mockReturnValue(mockCalUrl),
    } as unknown as Config;

    dataSource = new DefaultCalDataSource(mockNetworkService, mockConfig);
  });

  describe("getTokenInformation", () => {
    const mockUSDTResponse: CalTokenResponse = [
      {
        id: "ethereum/erc20/usd_tether__erc20_",
        decimals: 6,
        ticker: "USDT",
        name: "Tether USD",
        network_external_links: {
          explorers: [{ transaction: explorerTemplate }],
        },
      },
    ];
    it("should successfully call the CAL API to get token information", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockUSDTResponse),
      );

      const result = await dataSource.getTokenInformation(
        testTokenAddress,
        testCurrencyId,
      );

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockCalUrl}/v1/tokens?contract_address=${testTokenAddress}&network=${testCurrencyId}&output=id,name,decimals,ticker,network_external_links`,
      );

      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        const tokenInfo = result.extract();
        expect(tokenInfo).toEqual({
          id: "ethereum/erc20/usd_tether__erc20_",
          decimals: 6,
          ticker: "USDT",
          name: "Tether USD",
          transactionExplorerUrlTemplate: explorerTemplate,
        });
      }
    });

    it.each([
      {
        currencyId: "ethereum",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        expectedUrl: `${mockCalUrl}/v1/tokens?contract_address=0xdAC17F958D2ee523a2206206994597C13D831ec7&network=ethereum&output=id,name,decimals,ticker,network_external_links`,
      },
      {
        currencyId: "base",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        expectedUrl: `${mockCalUrl}/v1/tokens?contract_address=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&network=base&output=id,name,decimals,ticker,network_external_links`,
      },
      {
        currencyId: "polygon",
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        expectedUrl: `${mockCalUrl}/v1/tokens?contract_address=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&network=polygon&output=id,name,decimals,ticker,network_external_links`,
      },
      {
        currencyId: "solana",
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        expectedUrl: `${mockCalUrl}/v1/tokens?contract_address=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&network=solana&output=id,name,decimals,ticker,network_external_links`,
      },
    ])(
      "builds CAL URL with network=$currencyId",
      async ({ currencyId, address, expectedUrl }) => {
        vi.mocked(mockNetworkService.get).mockResolvedValue(
          Right([
            {
              id: `${currencyId}/token/test`,
              decimals: 6,
              ticker: "TEST",
              name: "Test Token",
            },
          ] satisfies CalTokenResponse),
        );

        await dataSource.getTokenInformation(address, currencyId);

        expect(mockNetworkService.get).toHaveBeenCalledWith(expectedUrl);
      },
    );

    it("maps transactionExplorerUrlTemplate to undefined when CAL returns no network_external_links", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right([
          {
            id: "ethereum/erc20/usd_tether__erc20_",
            decimals: 6,
            ticker: "USDT",
            name: "Tether USD",
          },
        ] satisfies CalTokenResponse),
      );

      const result = await dataSource.getTokenInformation(
        testTokenAddress,
        testCurrencyId,
      );

      expect(result.extract()).toMatchObject({
        transactionExplorerUrlTemplate: undefined,
      });
    });

    it("should return Left when network service returns Left", async () => {
      const networkError = new Error("Network request failed");
      vi.mocked(mockNetworkService.get).mockResolvedValue(Left(networkError));

      const result = await dataSource.getTokenInformation(
        testTokenAddress,
        testCurrencyId,
      );

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.extract() as Error;
        expect(error.message).toBe(
          "Failed to fetch token information from Cal",
        );
      }
    });
    it("should return Left when response array is empty", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(Right([]));

      const result = await dataSource.getTokenInformation(
        testTokenAddress,
        testCurrencyId,
      );

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.extract() as Error;
        expect(error.message).toBe("No token information found in Cal");
      }
    });
  });

  describe("getCurrencyInformation", () => {
    const mockEthereumResponse: CalCoinResponse = [
      {
        id: "ethereum",
        name: "Ethereum",
        ticker: "ETH",
        units: [{ name: "ether", code: "ETH", magnitude: 18 }],
        network_external_links: {
          explorers: [{ transaction: explorerTemplate }],
        },
      },
    ];

    it("should successfully call the CAL API to get currency information", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(mockEthereumResponse),
      );

      const result = await dataSource.getCurrencyInformation(testCurrencyId);

      expect(mockNetworkService.get).toHaveBeenCalledWith(
        `${mockCalUrl}/v1/coins?id=${testCurrencyId}&output=id,name,ticker,units,network_external_links`,
      );

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const currencyInfo = result.extract();
        expect(currencyInfo).toEqual({
          id: "ethereum",
          name: "Ethereum",
          ticker: "ETH",
          decimals: 18,
          transactionExplorerUrlTemplate: explorerTemplate,
        });
      }
    });

    it("maps transactionExplorerUrlTemplate to undefined when the explorers list is empty", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right([
          {
            id: "ethereum",
            name: "Ethereum",
            ticker: "ETH",
            units: [{ name: "ether", code: "ETH", magnitude: 18 }],
            network_external_links: { explorers: [] },
          },
        ] satisfies CalCoinResponse),
      );

      const result = await dataSource.getCurrencyInformation(testCurrencyId);

      expect(result.extract()).toMatchObject({
        transactionExplorerUrlTemplate: undefined,
      });
    });

    it("should return Left when network service returns Left", async () => {
      const networkError = new Error("Network request failed");
      vi.mocked(mockNetworkService.get).mockResolvedValue(Left(networkError));

      const result = await dataSource.getCurrencyInformation(testCurrencyId);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.extract() as Error;
        expect(error.message).toBe(
          "Failed to fetch currency information from Cal",
        );
      }
    });

    it("should return Left when response array is empty", async () => {
      vi.mocked(mockNetworkService.get).mockResolvedValue(Right([]));

      const result = await dataSource.getCurrencyInformation(testCurrencyId);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.extract() as Error;
        expect(error.message).toBe("No currency information found in Cal");
      }
    });

    it("should return Left when units array is empty", async () => {
      const responseWithNoUnits: CalCoinResponse = [
        {
          id: "ethereum",
          name: "Ethereum",
          ticker: "ETH",
          units: [],
        },
      ];
      vi.mocked(mockNetworkService.get).mockResolvedValue(
        Right(responseWithNoUnits),
      );

      const result = await dataSource.getCurrencyInformation(testCurrencyId);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        const error = result.extract() as Error;
        expect(error.message).toBe(
          "No units found for currency ethereum in Cal",
        );
      }
    });
  });
});
