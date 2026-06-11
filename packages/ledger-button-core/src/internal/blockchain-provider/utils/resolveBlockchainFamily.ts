import { Maybe } from "purify-ts";

import { isSupportedEvmCurrency } from "../../evm-provider/utils/chainUtils.js";
import { isSupportedSolanaCurrency } from "../../solana-provider/utils/clusterUtils.js";
import { BlockchainFamily } from "../model/BlockchainProvider.js";

/**
 * Resolve the {@link BlockchainFamily} a currency belongs to.
 *
 * Returns `Nothing` when the currency is not handled by any known provider.
 */
export function resolveBlockchainFamily(
  currencyId: string,
): Maybe<BlockchainFamily> {
  if (isSupportedEvmCurrency(currencyId)) {
    return Maybe.of("evm");
  }

  if (isSupportedSolanaCurrency(currencyId)) {
    return Maybe.of("solana");
  }

  return Maybe.empty();
}
