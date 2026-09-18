import type { BlockchainNetwork } from "@api/model/dappConfig/BlockchainConfig";

export type ConfigOverrides = {
  networkOverrides: Record<string, BlockchainNetwork[]>;
};

export const DEFAULT_CONFIG_OVERRIDES: ConfigOverrides = {
  networkOverrides: {},
};
