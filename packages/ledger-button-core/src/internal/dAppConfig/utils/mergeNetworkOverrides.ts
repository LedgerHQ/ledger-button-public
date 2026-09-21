import type { BlockchainNetwork } from "@api/model/dappConfig/BlockchainConfig";

import type { DAppConfig } from "../model/dAppConfigTypes";

// Developer-mode, EVM-only
export function mergeNetworkOverrides(
  config: DAppConfig,
  overrides: BlockchainNetwork[],
): DAppConfig {
  if (overrides.length === 0) {
    return config;
  }

  const index = config.blockchains.findIndex(
    (blockchain) => blockchain.blockchain === "ethereum",
  );
  const ethereum = config.blockchains[index];
  if (!ethereum) {
    return config;
  }

  const blockchains = [...config.blockchains];
  blockchains[index] = {
    ...ethereum,
    networks: [...ethereum.networks, ...overrides],
  };

  return { ...config, blockchains };
}
