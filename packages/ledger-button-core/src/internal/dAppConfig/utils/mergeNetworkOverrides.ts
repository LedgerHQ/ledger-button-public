import type { ConfigOverrides } from "@internal/storage/model/ConfigOverrides";

import type { DAppConfig } from "../model/dAppConfigTypes";

export function mergeNetworkOverrides(
  config: DAppConfig,
  overrides: ConfigOverrides["networkOverrides"],
): DAppConfig {
  if (Object.keys(overrides).length === 0) {
    return config;
  }

  return {
    ...config,
    blockchains: config.blockchains.map((blockchain) => {
      const networksOverrides = overrides[blockchain.blockchain];
      if (!networksOverrides?.length) {
        return blockchain;
      }

      return {
        ...blockchain,
        networks: [...blockchain.networks, ...networksOverrides],
      };
    }),
  };
}
