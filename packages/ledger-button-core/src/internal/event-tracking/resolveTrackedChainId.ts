import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import {
  type ButtonCoreContext,
  DEFAULT_BLOCKCHAIN_FAMILY,
  getSelectedAccount,
} from "@api/model/ButtonCoreContext";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";

/**
 * Resolve the `chain_id` reported for a `family`. `context.chainId` only
 * follows the EVM selection, so other families read the network of their own
 * selected account instead.
 */
export function resolveTrackedChainId(
  context: ButtonCoreContext,
  family: BlockchainFamily,
  blockchainProviderManager: BlockchainProviderManager,
): string | null {
  if (family === DEFAULT_BLOCKCHAIN_FAMILY) {
    return context.chainId.toString();
  }
  const account = getSelectedAccount(context, family);
  if (!account) {
    return null;
  }
  return blockchainProviderManager
    .describeCurrency(account.currencyId)
    .map((currency) => currency.networkId)
    .extractNullable();
}
