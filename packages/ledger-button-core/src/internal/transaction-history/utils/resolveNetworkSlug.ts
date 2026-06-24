import { isSupportedEvmCurrency } from "../../evm-provider/ledger-eip1193/utils/chainUtils.js";
import { isSupportedSolanaCurrency } from "../../solana-provider/ledger-solana-wallet/utils/clusterUtils.js";

/**
 * Predicates that decide whether a `currencyId` is supported by the Coin
 * Service transaction history endpoint. Add a new chain by appending its
 * `isSupported*Currency` check here.
 */
const SUPPORTED_CURRENCY_CHECKS: ReadonlyArray<(currencyId: string) => boolean> =
  [isSupportedEvmCurrency, isSupportedSolanaCurrency];

/**
 * Resolve the Coin Service network slug for a given `currencyId`.
 *
 * Returns the `currencyId` itself when at least one supported-currency check
 * matches, otherwise `undefined` so callers can surface a typed error.
 */
export function resolveNetworkSlug(currencyId: string): string | undefined {
  const isSupported = SUPPORTED_CURRENCY_CHECKS.some((isSupportedCurrency) =>
    isSupportedCurrency(currencyId),
  );
  return isSupported ? currencyId : undefined;
}
