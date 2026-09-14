import type { BlockchainNetwork } from "@api/model/dappConfig/BlockchainConfig";

export type ConfigOverrides = {
  /**
   * Per-blockchain network additions keyed by blockchain ID (e.g. "ethereum",
   * "solana").
   */
  networkOverrides: Record<string, BlockchainNetwork[]>;
};

export const DEFAULT_CONFIG_OVERRIDES: ConfigOverrides = {
  networkOverrides: {},
};
