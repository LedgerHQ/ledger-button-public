import type { BlockchainConfig } from "../../model/dappConfig/BlockchainConfig";

/**
 * Finds the {@link BlockchainConfig} slice for a given blockchain family
 * from the list of blockchain configs passed to a {@link BlockchainProviderFactory}.
 *
 * Returns `undefined` when the family has no entry — the factory should
 * return `undefined` in that case so {@link BlockchainProviderManager}
 * skips registration.
 */
export const findBlockchainConfig = (
  blockchains: BlockchainConfig[],
  family: string,
): BlockchainConfig | undefined =>
  blockchains.find((b) => b.blockchain === family);
