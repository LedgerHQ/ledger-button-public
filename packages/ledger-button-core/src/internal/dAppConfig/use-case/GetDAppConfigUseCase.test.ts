import { describe, expect, it, vi } from "vitest";

import { DEFAULT_CONFIG_OVERRIDES } from "@internal/storage/model/ConfigOverrides";

import type { DAppConfigDataSource } from "../datasource/DAppConfigDataSource";
import type { DAppConfig } from "../model/dAppConfigTypes";
import { GetDAppConfigUseCase } from "./GetDAppConfigUseCase";

const BASE_CONFIG: DAppConfig = {
  name: "Test dApp",
  liveAppId: "test-dapp",
  domainUrl: "https://test.dapp",
  referralUrl: "",
  featureFlags: {},
  blockchains: [
    {
      blockchain: "ethereum",
      appName: "Ethereum",
      networks: [
        {
          id: "1",
          currencyId: "ethereum",
          currencyName: "Ethereum",
          currencyTicker: "ETH",
        },
      ],
      rpcMethods: { local: [], broadcasted: [] },
      appDependencies: { appName: "Ethereum", dependencies: [] },
    },
    {
      blockchain: "solana",
      appName: "Solana",
      networks: [
        {
          id: "mainnet-beta",
          currencyId: "solana",
          currencyName: "Solana",
          currencyTicker: "SOL",
        },
      ],
      rpcMethods: { local: [], broadcasted: [] },
      appDependencies: { appName: "Solana", dependencies: [] },
    },
  ],
};

function createUseCase({
  config = BASE_CONFIG,
  networkOverrides = {},
}: {
  config?: DAppConfig;
  networkOverrides?: Record<string, { id: string; currencyId: string; currencyName: string; currencyTicker: string }[]>;
} = {}) {
  const dataSource: DAppConfigDataSource = {
    getDAppConfig: vi.fn().mockResolvedValue(config),
  };

  const storageService = {
    getConfigOverrides: vi.fn().mockReturnValue({
      ...DEFAULT_CONFIG_OVERRIDES,
      networkOverrides,
    }),
  };

  const loggerFactory = vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const useCase = new GetDAppConfigUseCase(
    loggerFactory,
    dataSource,
    storageService as never,
  );

  return { useCase, dataSource, storageService };
}

describe("GetDAppConfigUseCase", () => {
  describe("execute", () => {
    it("returns the config from the data source", async () => {
      const { useCase } = createUseCase();

      const result = await useCase.execute();

      expect(result).toMatchObject({ name: "Test dApp" });
    });

    it("re-throws when the data source fails", async () => {
      const { useCase, dataSource } = createUseCase();
      vi.mocked(dataSource.getDAppConfig).mockRejectedValue(
        new Error("network error"),
      );

      await expect(useCase.execute()).rejects.toThrow("network error");
    });
  });

  describe("mergeNetworkOverrides", () => {
    it("returns the config unchanged when there are no overrides", async () => {
      const { useCase } = createUseCase({ networkOverrides: {} });

      const result = await useCase.execute();

      expect(result.blockchains).toEqual(BASE_CONFIG.blockchains);
    });

    it("appends override networks to the matching blockchain", async () => {
      const blastNetwork = {
        id: "81457",
        currencyId: "blast",
        currencyName: "Blast",
        currencyTicker: "ETH",
      };

      const { useCase } = createUseCase({
        networkOverrides: { ethereum: [blastNetwork] },
      });

      const result = await useCase.execute();
      const ethBlockchain = result.blockchains.find(
        (b) => b.blockchain === "ethereum",
      );

      expect(ethBlockchain?.networks).toEqual([
        BASE_CONFIG.blockchains[0].networks[0],
        blastNetwork,
      ]);
    });

    it("does not affect blockchains with no matching override key", async () => {
      const blastNetwork = {
        id: "81457",
        currencyId: "blast",
        currencyName: "Blast",
        currencyTicker: "ETH",
      };

      const { useCase } = createUseCase({
        networkOverrides: { ethereum: [blastNetwork] },
      });

      const result = await useCase.execute();
      const solanaBlockchain = result.blockchains.find(
        (b) => b.blockchain === "solana",
      );

      expect(solanaBlockchain?.networks).toEqual(
        BASE_CONFIG.blockchains[1].networks,
      );
    });

    it("appends overrides to multiple blockchains independently", async () => {
      const blastNetwork = {
        id: "81457",
        currencyId: "blast",
        currencyName: "Blast",
        currencyTicker: "ETH",
      };
      const solanaDevnet = {
        id: "devnet",
        currencyId: "solana_devnet",
        currencyName: "Solana Devnet",
        currencyTicker: "SOL",
      };

      const { useCase } = createUseCase({
        networkOverrides: {
          ethereum: [blastNetwork],
          solana: [solanaDevnet],
        },
      });

      const result = await useCase.execute();

      const ethNetworks = result.blockchains.find(
        (b) => b.blockchain === "ethereum",
      )?.networks;
      const solanaNetworks = result.blockchains.find(
        (b) => b.blockchain === "solana",
      )?.networks;

      expect(ethNetworks).toHaveLength(2);
      expect(ethNetworks).toContainEqual(blastNetwork);
      expect(solanaNetworks).toHaveLength(2);
      expect(solanaNetworks).toContainEqual(solanaDevnet);
    });

    it("preserves non-network blockchain fields when merging", async () => {
      const { useCase } = createUseCase({
        networkOverrides: {
          ethereum: [
            {
              id: "81457",
              currencyId: "blast",
              currencyName: "Blast",
              currencyTicker: "ETH",
            },
          ],
        },
      });

      const result = await useCase.execute();
      const ethBlockchain = result.blockchains.find(
        (b) => b.blockchain === "ethereum",
      );

      expect(ethBlockchain?.appName).toBe("Ethereum");
      expect(ethBlockchain?.rpcMethods).toEqual({ local: [], broadcasted: [] });
      expect(ethBlockchain?.appDependencies).toEqual({
        appName: "Ethereum",
        dependencies: [],
      });
    });
  });
});
