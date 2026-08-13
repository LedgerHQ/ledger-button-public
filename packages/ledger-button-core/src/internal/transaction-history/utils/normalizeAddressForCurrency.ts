import type { BlockchainFamily } from "@api/blockchain-provider/model/types.js";

/**
 * Normalize an address for storage/comparison according to the conventions of
 * its chain family.
 *
 * EVM addresses are hex and case-insensitive, so they are lowercased to keep
 * comparisons stable. Solana addresses are base58 encoded and case-sensitive,
 * so they must be passed through untouched — lowercasing them corrupts the
 * value. The family is resolved by the caller (via the blockchain provider
 * manager) so this helper stays free of family-specific chain tables.
 */
export function normalizeAddressForCurrency(
  address: string,
  family: BlockchainFamily | undefined,
): string {
  return family === "ethereum" ? address.toLowerCase() : address;
}
