import type { BlockchainFamily } from "@api/blockchain-provider/model/types";

/**
 * Resolve the Coin Service network slug for a given `currencyId`.
 *
 * Support is decided by the caller (via the blockchain provider manager) and
 * passed in as the resolved {@link BlockchainFamily}; this keeps the helper free
 * of any family-specific chain tables. Returns the `currencyId` itself when a
 * provider handles the currency, otherwise `undefined` so callers can surface a
 * typed error.
 */
export function resolveNetworkSlug(
  currencyId: string,
  family: BlockchainFamily | undefined,
): string | undefined {
  return family ? currencyId : undefined;
}
