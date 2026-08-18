import type {
  BlockchainFamily,
  ProviderSignParams,
} from "@api/blockchain-provider/model/types";

import { isSignSolanaMessageParams } from "./solana/SignSolanaMessageParams";
import { isSignSolanaTransactionParams } from "./solana/SignSolanaTransactionParams";
import { DEFAULT_BLOCKCHAIN_FAMILY } from "../ButtonCoreContext";

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
