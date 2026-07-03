import { isSupportedEvmCurrency } from "../../evm-provider/ledger-eip1193/utils/chainUtils.js";
import { isSupportedSolanaCurrency } from "../../solana-provider/ledger-solana-wallet/utils/clusterUtils.js";

/**
 * Normalize an address for storage/comparison according to the conventions of
 * its chain.
 *
 * EVM addresses are hex and case-insensitive, so they are lowercased to keep
 * comparisons stable. Solana addresses are base58 encoded and case-sensitive,
 * so they must be passed through untouched — lowercasing them corrupts the
 * value.
 */
export function normalizeAddressForCurrency(
  address: string,
  currencyId: string,
): string {
  if (isSupportedSolanaCurrency(currencyId)) {
    return address;
  }

  if (isSupportedEvmCurrency(currencyId)) {
    return address.toLowerCase();
  }

  return address;
}
