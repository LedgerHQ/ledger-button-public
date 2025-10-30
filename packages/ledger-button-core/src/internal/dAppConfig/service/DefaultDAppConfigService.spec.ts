import { Left, Right } from "purify-ts";

import type { BackendService } from "../../backend/BackendService.js";
import type { Config } from "../../config/model/config.js";
import type { DAppConfig } from "../dAppConfigTypes.js";
import { DefaultDAppConfigService } from "./DefaultDAppConfigService.js";

describe("DefaultDAppConfigService", () => {
  let dAppConfigService: DefaultDAppConfigService;
  let mockConfig: Config;
  let mockBackendService: BackendService;

  const mockDAppConfig: DAppConfig = {
    supportedBlockchains: [
      {
        id: "ethereum-1",
        currency_id: "ethereum",
        currency_name: "Ethereum",
        currency_ticker: "ETH",
      },
      {
        id: "polygon-2",
        currency_id: "polygon",
        currency_name: "Polygon",
        currency_ticker: "MATIC",
      },
    ],
    referralUrl: "https://example.com/referral",
    domainUrl: "https://example.com",
    appDependencies: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Config
    mockConfig = {
      dAppIdentifier: "test-dapp-id",
      originToken: "test-origin-token",
    } as Config;

    // Mock BackendService
    mockBackendService = {
      getConfig: vi.fn(),
      broadcast: vi.fn(),
      event: vi.fn(),
    } as unknown as BackendService;

    dAppConfigService = new DefaultDAppConfigService(
      mockConfig,
      mockBackendService,
    );
  });

  describe("getDAppConfig", () => {
    it("should fetch and return DApp config on first call", async () => {
      vi.spyOn(mockBackendService, "getConfig").mockResolvedValue(
        Right(mockDAppConfig),
      );

      const result = await dAppConfigService.getDAppConfig();

      expect(result).toEqual(mockDAppConfig);
      expect(mockBackendService.getConfig).toHaveBeenCalledTimes(1);
      expect(mockBackendService.getConfig).toHaveBeenCalledWith({
        dAppIdentifier: "test-dapp-id",
      });
    });

    it("should cache config and not call backend on subsequent calls", async () => {
      vi.spyOn(mockBackendService, "getConfig").mockResolvedValue(
        Right(mockDAppConfig),
      );

      // First call
      const result1 = await dAppConfigService.getDAppConfig();
      expect(result1).toEqual(mockDAppConfig);
      expect(mockBackendService.getConfig).toHaveBeenCalledTimes(1);

      // Second call - should use cached value
      const result2 = await dAppConfigService.getDAppConfig();
      expect(result2).toEqual(mockDAppConfig);
      expect(mockBackendService.getConfig).toHaveBeenCalledTimes(1); // Still only 1 call

      // Third call - should still use cached value
      const result3 = await dAppConfigService.getDAppConfig();
      expect(result3).toEqual(mockDAppConfig);
      expect(mockBackendService.getConfig).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it("should throw error when backend service returns Left", async () => {
      const backendError = new Error("Backend service unavailable");
      vi.spyOn(mockBackendService, "getConfig").mockResolvedValue(
        Left(backendError),
      );

      await expect(dAppConfigService.getDAppConfig()).rejects.toThrow(
        "Failed to get DApp config",
      );
      expect(mockBackendService.getConfig).toHaveBeenCalledTimes(1);
    });

    it("should throw error when backend service returns network error", async () => {
      const networkError = new Error("Network timeout");
      vi.spyOn(mockBackendService, "getConfig").mockResolvedValue(
        Left(networkError),
      );

      await expect(dAppConfigService.getDAppConfig()).rejects.toThrow(
        "Failed to get DApp config",
      );
    });

    it("should use the correct dAppIdentifier from config", async () => {
      const customConfig = {
        dAppIdentifier: "custom-dapp-identifier",
        originToken: "test-token",
      } as Config;

      const customService = new DefaultDAppConfigService(
        customConfig,
        mockBackendService,
      );

      vi.spyOn(mockBackendService, "getConfig").mockResolvedValue(
        Right(mockDAppConfig),
      );

      await customService.getDAppConfig();

      expect(mockBackendService.getConfig).toHaveBeenCalledWith({
        dAppIdentifier: "custom-dapp-identifier",
      });
    });

    it("should handle config with appDependencies", async () => {
      const configWithDependencies: DAppConfig = {
        supportedBlockchains: [
          {
            id: "ethereum-1",
            currency_id: "ethereum",
            currency_name: "Ethereum",
            currency_ticker: "ETH",
          },
        ],
        referralUrl: "https://example.com/referral",
        domainUrl: "https://example.com",
        appDependencies: [
          {
            blockchain: "ethereum",
            appName: "wallet-connect",
            dependencies: ["eth-lib", "web3-utils"],
          },
          {
            blockchain: "polygon",
            appName: "web3-provider",
            dependencies: ["ethers"],
          },
        ],
      };

      vi.spyOn(mockBackendService, "getConfig").mockResolvedValue(
        Right(configWithDependencies),
      );

      const result = await dAppConfigService.getDAppConfig();

      expect(result.appDependencies).toHaveLength(2);
      expect(result.appDependencies[0].appName).toBe("wallet-connect");
      expect(result.appDependencies[0].blockchain).toBe("ethereum");
      expect(result.appDependencies[0].dependencies).toContain("eth-lib");
      expect(result.appDependencies[1].appName).toBe("web3-provider");
      expect(result.appDependencies[1].blockchain).toBe("polygon");
    });

    it("should preserve all config properties", async () => {
      vi.spyOn(mockBackendService, "getConfig").mockResolvedValue(
        Right(mockDAppConfig),
      );

      const result = await dAppConfigService.getDAppConfig();

      expect(result).toHaveProperty("supportedBlockchains");
      expect(result).toHaveProperty("referralUrl");
      expect(result).toHaveProperty("domainUrl");
      expect(result).toHaveProperty("appDependencies");
      expect(result.referralUrl).toBe("https://example.com/referral");
      expect(result.domainUrl).toBe("https://example.com");
    });

    it("should handle backend service throwing an error", async () => {
      vi.spyOn(mockBackendService, "getConfig").mockRejectedValue(
        new Error("Connection refused"),
      );

      await expect(dAppConfigService.getDAppConfig()).rejects.toThrow(
        "Connection refused",
      );
    });
  });
});
