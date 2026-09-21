import { describe, expect, it, vi } from "vitest";

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
  ],
};

const BLAST_NETWORK = {
  id: "81457",
  currencyId: "blast",
  currencyName: "Blast",
  currencyTicker: "ETH",
};

function createUseCase({
  config = BASE_CONFIG,
  networkOverrides = [],
}: {
  config?: DAppConfig;
  networkOverrides?: typeof BLAST_NETWORK[];
} = {}) {
  const dataSource: DAppConfigDataSource = {
    getDAppConfig: vi.fn().mockResolvedValue(config),
  };

  const storageService = {
    getConfigOverrides: vi.fn().mockReturnValue(networkOverrides),
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

    it("merges stored network overrides into the config", async () => {
      const { useCase } = createUseCase({
        networkOverrides: [BLAST_NETWORK],
      });

      const result = await useCase.execute();
      const ethBlockchain = result.blockchains.find(
        (b) => b.blockchain === "ethereum",
      );

      expect(ethBlockchain?.networks).toContainEqual(BLAST_NETWORK);
    });

    it("returns unmodified config when no overrides are stored", async () => {
      const { useCase } = createUseCase();

      const result = await useCase.execute();
      const ethBlockchain = result.blockchains.find(
        (b) => b.blockchain === "ethereum",
      );

      expect(ethBlockchain?.networks).toHaveLength(1);
      expect(ethBlockchain?.networks[0]?.currencyId).toBe("ethereum");
    });
  });
});
