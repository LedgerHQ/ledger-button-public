import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import { getCoinServiceCurrencySlug } from "@internal/balance/constants/networkConstants";

/**
 * Resolve the Coin Service network slug for a given `currencyId`.
 *
 * Support is decided by the caller (via the blockchain provider manager) and
 * passed in as the resolved {@link BlockchainFamily}; this keeps the helper free
 * of any family-specific chain tables. Returns the CoinService slug of the
 * currency (the `currencyId` itself, except e.g. `ripple` becomes `xrp`) when a
 * provider handles it, otherwise `undefined` so callers can surface a typed
 * error.
 */
export function resolveNetworkSlug(
  currencyId: string,
  family: BlockchainFamily | undefined,
): string | undefined {
  return family ? getCoinServiceCurrencySlug(currencyId) : undefined;
}
