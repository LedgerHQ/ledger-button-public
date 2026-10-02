/**
 * Extension seam for family-owned signed-result unions (inversion of control).
 *
 * Each blockchain family augments this registry from its OWN package to declare
 * the results it can emit, e.g. in `@ledgerhq/ledger-wallet-provider-evm`:
 *
 * ```ts
 * declare module "@ledgerhq/ledger-wallet-provider-core" {
 *   interface SignedResultRegistry { evm: EvmSignedResult }
 * }
 * ```
 *
 * DIP + Open/Closed: `api` owns only the abstraction; families provide the
 * implementations from their own package. Adding a family (Solana, BTC, XRP, ...)
 * touches only that family's package — never `api` or another family.
 *
 * Core itself always includes the shared transport results below so core
 * typechecks without loading family packages. Family augmentations widen the
 * union further (e.g. Solana-specific result shapes).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
export interface SignedResultRegistry {}

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

/**
 * Shared transport union carried across the family-agnostic boundary
 * (SignFlowStatus, CoreFacade, the sign controller).
 *
 * Always includes the core shared result shapes. Family packages widen this
 * further by augmenting {@link SignedResultRegistry} (loaded via side-effect
 * imports of those packages at the host composition root).
 *
 * TRANSPORT ONLY: family-specific code (narrowing helpers, use-case return
 * types) MUST reference its own family union (EvmSignedResult, SolanaSignedResult,
 * ...), never this shared type.
 */
export type SignedResults =
  | BroadcastedTransactionResult
  | SignedTransactionResult
  | SignedPersonalMessageOrTypedDataResult
  | SignedResultRegistry[keyof SignedResultRegistry];
// TODO: Handle error return type
// (should be resolved in LedgerButtonCore and rejeced in the provider)

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
