export type SignedResults =
  | BroadcastedTransactionResult
  | SignedTransactionResult
  | SignedTypedDataResult;

export interface BroadcastedTransactionResult {
  hash: string;
  rawTransaction: Uint8Array<ArrayBufferLike>;
  signedRawTransaction: string;
}

export interface SignedTransactionResult {
  rawTransaction: Uint8Array<ArrayBufferLike>;
  signedRawTransaction: string;
}

export interface SignedTypedDataResult {
  signature: string;
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

export function isSignedTypedDataResult(
  signedTransaction: unknown,
): signedTransaction is SignedTypedDataResult {
  return (
    !!signedTransaction &&
    typeof signedTransaction === "object" &&
    "signature" in signedTransaction
  );
}
