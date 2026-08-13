import type { SignedPersonalMessageOrTypedDataResult } from "@api/model/signing/SignedTransaction.js";

/**
 * Result of a Solana transaction signing flow: the raw 64-byte ed25519
 * signature returned by the device. The provider reassembles the fully signed
 * wire transaction from this signature before returning it to the dApp.
 */
export interface SignedSolanaTransactionResult {
  solanaSignature: Uint8Array;
}

/**
 * Result of a Solana sign-and-send flow once the signed wire transaction has
 * been broadcast. `hash` is the base58 transaction signature (its explorer id)
 * used to track the pending transaction; `signature` is the raw 64-byte
 * signature returned to the dApp per the Wallet Standard contract.
 */
export interface BroadcastedSolanaTransactionResult {
  hash: string;
  signature: Uint8Array;
}

/**
 * Results the Solana sign flow can emit. Owned by the Solana provider and used
 * by its own narrowing helpers and use-case return types. The shared
 * `SignedResults` transport union derives from it via the registry augmentation
 * below, so `api` never depends on this family folder.
 */
export type SolanaSignedResult =
  | SignedSolanaTransactionResult
  | BroadcastedSolanaTransactionResult
  | SignedPersonalMessageOrTypedDataResult;

export function isSignedSolanaTransactionResult(
  signedTransaction: unknown,
): signedTransaction is SignedSolanaTransactionResult {
  return (
    !!signedTransaction &&
    typeof signedTransaction === "object" &&
    "solanaSignature" in signedTransaction
  );
}

export function isBroadcastedSolanaTransactionResult(
  signedTransaction: unknown,
): signedTransaction is BroadcastedSolanaTransactionResult {
  return (
    !!signedTransaction &&
    typeof signedTransaction === "object" &&
    "hash" in signedTransaction &&
    "signature" in signedTransaction
  );
}

declare module "@api/model/signing/SignedTransaction.js" {
  interface SignedResultRegistry {
    solana: SolanaSignedResult;
  }
}
