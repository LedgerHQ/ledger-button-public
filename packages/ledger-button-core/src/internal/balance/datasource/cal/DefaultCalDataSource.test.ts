import { Left, Maybe, Right } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { aCurrencyDescriptor } from "@internal/blockchain-provider/__mocks__/currencyDescriptorMock";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";
import type { Config } from "@internal/config/model/config";
import type { NetworkService } from "@internal/network/NetworkService";

import type { CalCoinResponse, CalTokenResponse } from "./calTypes";
import { DefaultCalDataSource } from "./DefaultCalDataSource";

describe("DefaultCalDataSource", () => {
  let dataSource: DefaultCalDataSource;
  let mockNetworkService: NetworkService<unknown>;
  let mockConfig: Config;
  let mockBlockchainProviderManager: BlockchainProviderManager;

  const mockCalUrl = "https://api.cal.test";
  const testTokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const testCurrencyId = "ethereum";
  const testChainId = "1";
  const explorerTemplate = "https://etherscan.io/tx/${hash}";

  beforeEach(() => {
    mockNetworkService = {
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as NetworkService<unknown>;

    mockConfig = {
      getCalUrl: vi.fn().mockReturnValue(mockCalUrl),
    } as unknown as Config;

    mockBlockchainProviderManager = {
      init: vi.fn(),
      setSelectedAccounts: vi.fn(),
      setNetwork: vi.fn(),
      describeCurrency: vi
        .fn()
        .mockReturnValue(
          Maybe.of(aCurrencyDescriptor({ networkId: testChainId })),
        ),
      describeNetwork: vi.fn().mockReturnValue(Maybe.empty()),
    };

    dataSource = new DefaultCalDataSource(
      mockNetworkService,
      mockConfig,
      mockBlockchainProviderManager,
    );
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
        `${mockCalUrl}/v1/tokens?contract_address=${testTokenAddress}&chain_id=${testChainId}&output=id,name,decimals,ticker,network_external_links`,
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
