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

function createUseCase(config: DAppConfig = BASE_CONFIG) {
  const dataSource: DAppConfigDataSource = {
    getDAppConfig: vi.fn().mockResolvedValue(config),
  };

  const loggerFactory = vi.fn().mockReturnValue({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  });

  const useCase = new GetDAppConfigUseCase(loggerFactory, dataSource);

  return { useCase, dataSource };
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
});
