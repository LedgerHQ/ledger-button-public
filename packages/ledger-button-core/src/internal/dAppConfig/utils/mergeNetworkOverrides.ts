import type { ConfigOverrides } from "@internal/storage/model/ConfigOverrides";

import type { DAppConfig } from "../model/dAppConfigTypes";

export function mergeNetworkOverrides(
  config: DAppConfig,
  overrides: ConfigOverrides["networkOverrides"],
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
