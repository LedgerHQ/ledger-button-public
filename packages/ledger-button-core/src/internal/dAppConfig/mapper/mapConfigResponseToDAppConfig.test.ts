import type { ConfigResponse } from "@internal/backend/types";

import { mapConfigResponseToDAppConfig } from "./mapConfigResponseToDAppConfig";

const EVM_BLOCKCHAIN: ConfigResponse["blockchains"][number] = {
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
  rpcMethods: {
    local: ["eth_accounts"],
    broadcasted: ["eth_call"],
  },
  appDependencies: {
    appName: "Ethereum",
    dependencies: [{ name: "Ethereum", minVersion: null }],
  },
};

const SOLANA_BLOCKCHAIN: ConfigResponse["blockchains"][number] = {
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
  rpcMethods: {
    local: ["eth_sendTransaction"],
    broadcasted: ["eth_call"],
  },
  appDependencies: {
    appName: "Solana",
    dependencies: [{ name: "Solana", minVersion: ">=1.0.0" }],
  },
};

const RESPONSE: ConfigResponse = {
  name: "Ledger",
  liveAppId: "ledger",
  domainUrl: "https://ledger.com",
  referralUrl: "https://shop.ledger.com",
  blockchains: [EVM_BLOCKCHAIN],
  featureFlags: {},
};

describe("mapConfigResponseToDAppConfig", () => {
  it("maps the API response to the internal dApp config", () => {
    const result = mapConfigResponseToDAppConfig(RESPONSE);

    expect(result).toEqual({
      name: "Ledger",
      liveAppId: "ledger",
      domainUrl: "https://ledger.com",
      referralUrl: "https://shop.ledger.com",
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
          rpcMethods: {
            local: ["eth_accounts"],
            broadcasted: ["eth_call"],
          },
          appDependencies: {
            appName: "Ethereum",
            dependencies: [{ name: "Ethereum" }],
          },
        },
      ],
    });
  });

  it("drops a null minVersion and keeps a real one", () => {
    const result = mapConfigResponseToDAppConfig({
      ...RESPONSE,
      blockchains: [EVM_BLOCKCHAIN, SOLANA_BLOCKCHAIN],
    });

    expect(result.blockchains[0].appDependencies.dependencies).toEqual([
      { name: "Ethereum" },
    ]);
    expect(result.blockchains[1].appDependencies.dependencies).toEqual([
      { name: "Solana", minVersion: ">=1.0.0" },
    ]);
  });

  it("preserves every blockchain family returned by the API", () => {
    const result = mapConfigResponseToDAppConfig({
      ...RESPONSE,
      blockchains: [EVM_BLOCKCHAIN, SOLANA_BLOCKCHAIN],
    });

    expect(result.blockchains.map(({ blockchain }) => blockchain)).toEqual([
      "ethereum",
      "solana",
    ]);
  });

  it("forwards feature flags untouched", () => {
    const result = mapConfigResponseToDAppConfig({
      ...RESPONSE,
      featureFlags: { newOnboarding: true },
    });

    expect(result.featureFlags).toEqual({ newOnboarding: true });
  });
});
