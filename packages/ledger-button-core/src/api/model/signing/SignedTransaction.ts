/**
 * Extension seam for family-owned signed-result unions (inversion of control).
 *
 * Each blockchain family augments this registry from its OWN folder to declare
 * the results it can emit, e.g. in `internal/evm-provider`:
 *
 * ```ts
 * declare module ".../SignedTransaction.js" {
 *   interface SignedResultRegistry { evm: EvmSignedResult }
 * }
 * ```
 *
 * DIP + Open/Closed: `api` owns only the abstraction; families provide the
 * implementations from their own folder. Adding a family (Solana, BTC, XRP, ...)
 * touches only that family's folder — never `api` or another family.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
export interface SignedResultRegistry {}

/**
 * Shared transport union carried across the family-agnostic boundary
 * (SignFlowStatus, CoreFacade, the sign controller). Derived from every family
 * that has augmented {@link SignedResultRegistry}.
 *
 * TRANSPORT ONLY: family-specific code (narrowing helpers, use-case return
 * types) MUST reference its own family union (EvmSignedResult, SolanaSignedResult,
 * ...), never this shared type.
 */
export type SignedResults = SignedResultRegistry[keyof SignedResultRegistry];
// TODO: Handle error return type
// (should be resolved in LedgerButtonCore and rejeced in the provider)

export interface BroadcastedTransactionResult {
  hash: string;
  rawTransaction: Uint8Array<ArrayBufferLike>;
  signedRawTransaction: string;
}

export interface SignedTransactionResult {
  rawTransaction: Uint8Array<ArrayBufferLike>;
  signedRawTransaction: string;
}

export interface SignedPersonalMessageOrTypedDataResult {
  signature: string;
  /**
   * The exact byte string that was signed. For Solana off-chain messages this
   * is the OCM (preamble + content), which differs from the raw input message,
   * so consumers can verify the signature against it. Unset for EVM flows.
   */
  signedMessage?: Uint8Array;
}

export function isSignedTransactionResult(
  signedTransaction: unknown,
): signedTransaction is SignedTransactionResult {
  return (
    !!signedTransaction &&
    typeof signedTransaction === "object" &&
    "rawTransaction" in signedTransaction &&
    "signedRawTransaction" in signedTransaction
  );
}

export function isBroadcastedTransactionResult(
  signedTransaction: unknown,
): signedTransaction is BroadcastedTransactionResult {
  return (
    !!signedTransaction &&
    typeof signedTransaction === "object" &&
    "hash" in signedTransaction
  );
}

export function isSignedMessageOrTypedDataResult(
  signedTransaction: unknown,
): signedTransaction is SignedPersonalMessageOrTypedDataResult {
  return (
    !!signedTransaction &&
    typeof signedTransaction === "object" &&
    "signature" in signedTransaction
  );
}
