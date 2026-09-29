import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import {
  type ButtonCoreContext,
  getSelectedAccount,
} from "@api/model/ButtonCoreContext";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";

/**
 * Resolve the `chain_id` reported for a `family` from the network of that
 * family's selected account.
 */
export function resolveTrackedChainId(
  context: ButtonCoreContext,
  family: BlockchainFamily,
  blockchainProviderManager: BlockchainProviderManager,
): string | null {
  const account = getSelectedAccount(context, family);
  if (!account) {
    return null;
  }
  return blockchainProviderManager
    .describeCurrency(account.currencyId)
    .map((currency) => currency.networkId)
    .extractNullable();
}
