import { isSignSolanaMessageParams } from "./solana/SignSolanaMessageParams.js";
import { isSignSolanaTransactionParams } from "./solana/SignSolanaTransactionParams.js";
import type {
  BlockchainFamily,
  ProviderSignParams,
} from "../../blockchain-provider/model/types.js";
import { DEFAULT_BLOCKCHAIN_FAMILY } from "../ButtonCoreContext.js";

/**
 * Blockchain family a sign request belongs to, derived from the params
 * themselves.
 *
 * Never infer it from the "active" family: the user can be browsing EVM while a
 * Solana flow runs, and the resulting pending transaction, explorer link and
 * account refresh would all be attributed to the wrong chain.
 */
export function getSignParamsFamily(
  params: ProviderSignParams,
): BlockchainFamily {
  return isSignSolanaTransactionParams(params) ||
    isSignSolanaMessageParams(params)
    ? "solana"
    : DEFAULT_BLOCKCHAIN_FAMILY;
}
