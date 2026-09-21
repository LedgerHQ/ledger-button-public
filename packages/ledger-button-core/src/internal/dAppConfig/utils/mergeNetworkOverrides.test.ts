import { describe, expect, it } from "vitest";

import type { DAppConfig } from "../model/dAppConfigTypes";
import { mergeNetworkOverrides } from "./mergeNetworkOverrides";

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

const BLAST_NETWORK = {
  id: "81457",
  currencyId: "blast",
  currencyName: "Blast",
  currencyTicker: "ETH",
};

describe("mergeNetworkOverrides", () => {
  it("returns the config unchanged when there are no overrides", () => {
    expect(mergeNetworkOverrides(BASE_CONFIG, [])).toBe(BASE_CONFIG);
  });

  it("appends override networks to the ethereum blockchain", () => {
    const result = mergeNetworkOverrides(BASE_CONFIG, [BLAST_NETWORK]);
    const ethBlockchain = result.blockchains.find(
      (b) => b.blockchain === "ethereum",
    );

    expect(ethBlockchain?.networks).toEqual([
      BASE_CONFIG.blockchains[0].networks[0],
      BLAST_NETWORK,
    ]);
  });

  it("does not affect non-EVM blockchains", () => {
    const result = mergeNetworkOverrides(BASE_CONFIG, [BLAST_NETWORK]);
    const solanaBlockchain = result.blockchains.find(
      (b) => b.blockchain === "solana",
    );

    expect(solanaBlockchain?.networks).toEqual(
      BASE_CONFIG.blockchains[1].networks,
    );
  });

  it("preserves non-network blockchain fields when merging", () => {
    const result = mergeNetworkOverrides(BASE_CONFIG, [BLAST_NETWORK]);
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

  it("returns the config unchanged when there is no ethereum blockchain", () => {
    const solanaOnly: DAppConfig = {
      ...BASE_CONFIG,
      blockchains: [BASE_CONFIG.blockchains[1]],
    };

    expect(mergeNetworkOverrides(solanaOnly, [BLAST_NETWORK])).toBe(solanaOnly);
  });
});
