import { Left, Right } from "purify-ts";
import { ZodError } from "zod";

import type { BackendService } from "@internal/backend/BackendService";
import type { ConfigResponse } from "@internal/backend/types";
import type { Config } from "@internal/config/model/config";

import { DefaultDAppConfigDataSource } from "./DefaultDAppConfigDataSource";

const mockConfigResponse: ConfigResponse = {
  name: "1inch",
  liveAppId: "1inch",
  referralUrl: "https://shop.ledger.com",
  domainUrl: "https://1inch.com",
  blockchains: [
    {
      blockchain: "ethereum",
      appName: "1inch",
      networks: [
        {
          id: "1",
          currencyId: "ethereum",
          currencyName: "Ethereum",
          currencyTicker: "ETH",
        },
      ],
      rpcMethods: {
        local: ["eth_accounts"],
        broadcasted: ["eth_call"],
      },
      appDependencies: {
        appName: "1inch",
        dependencies: [
          { name: "1inch", minVersion: ">=1.0.0" },
          { name: "Ethereum", minVersion: null },
        ],
      },
    },
  ],
  featureFlags: {},
};

describe("DefaultDAppConfigDataSource", () => {
  let dataSource: DefaultDAppConfigDataSource;
  let mockBackendService: {
    getConfigV2: ReturnType<typeof vi.fn>;
  };
  let mockConfig: Pick<Config, "dAppIdentifier">;

  beforeEach(() => {
    mockBackendService = {
      getConfigV2: vi.fn(),
    };
    mockConfig = {
      dAppIdentifier: "1inch",
    };

    dataSource = new DefaultDAppConfigDataSource(
      mockConfig as Config,
      mockBackendService as unknown as BackendService,
    );
    vi.clearAllMocks();
  });

  it("fetches and maps the dApp config from the API", async () => {
    mockBackendService.getConfigV2.mockResolvedValueOnce(
      Right(mockConfigResponse),
    );

    const result = await dataSource.getDAppConfig();

    expect(mockBackendService.getConfigV2).toHaveBeenCalledWith({
      dAppIdentifier: "1inch",
    });
    expect(result).toMatchObject({
      name: "1inch",
      liveAppId: "1inch",
      referralUrl: "https://shop.ledger.com",
      domainUrl: "https://1inch.com",
      blockchains: [
        {
          blockchain: "ethereum",
          appName: "1inch",
          appDependencies: {
            appName: "1inch",
            dependencies: [
              { name: "1inch", minVersion: ">=1.0.0" },
              { name: "Ethereum" },
            ],
          },
        },
      ],
    });
  });

  it("caches the mapped dApp config", async () => {
    mockBackendService.getConfigV2.mockResolvedValue(Right(mockConfigResponse));

    await dataSource.getDAppConfig();
    await dataSource.getDAppConfig();

    expect(mockBackendService.getConfigV2).toHaveBeenCalledTimes(1);
  });

  it("throws when the API request fails", async () => {
    mockBackendService.getConfigV2.mockResolvedValueOnce(
      Left(new Error("network error")),
    );

    await expect(dataSource.getDAppConfig()).rejects.toThrow(
      "Failed to get DApp config V2",
    );
  });

  it("throws when the API response fails validation", async () => {
    mockBackendService.getConfigV2.mockResolvedValueOnce(
      Left(new ZodError([])),
    );

    await expect(dataSource.getDAppConfig()).rejects.toThrow(
      "Failed to get DApp config V2",
    );
  });
});
