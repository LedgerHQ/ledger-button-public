import { describe, expect, it } from "vitest";

import type { BlockchainConfig } from "../../model/dappConfig/BlockchainConfig";
import { findBlockchainConfig } from "./findBlockchainConfig";

const evmConfig: BlockchainConfig = {
  blockchain: "ethereum",
  appName: "Ethereum",
  networks: [
    {
      id: "1",
      currencyId: "ethereum",
      currencyName: "Ether",
      currencyTicker: "ETH",
    },
  ],
  rpcMethods: { local: [], broadcasted: ["eth_sendRawTransaction"] },
  appDependencies: { appName: "Ethereum", dependencies: [] },
};
const solanaConfig: BlockchainConfig = {
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
  rpcMethods: { local: [], broadcasted: ["sendTransaction"] },
  appDependencies: { appName: "Solana", dependencies: [] },
};
const blockchains: BlockchainConfig[] = [evmConfig, solanaConfig];

describe("findBlockchainConfig", () => {
  it("returns the matching config when the family is present", () => {
    expect(findBlockchainConfig(blockchains, "ethereum")).toBe(evmConfig);
    expect(findBlockchainConfig(blockchains, "solana")).toBe(solanaConfig);
  });

  it("returns undefined when the family is not present", () => {
    expect(findBlockchainConfig(blockchains, "bitcoin")).toBeUndefined();
  });

  it("returns undefined for an empty array", () => {
    expect(findBlockchainConfig([], "ethereum")).toBeUndefined();
  });
});
