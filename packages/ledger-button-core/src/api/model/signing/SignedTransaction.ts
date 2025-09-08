export type SignedTransaction =
  | BroadcastedTransactionResult
  | SignedTransactionResult;

export interface BroadcastedTransactionResult {
  hash: string;
  rawTransaction: Uint8Array<ArrayBufferLike>;
  signedRawTransaction: string;
}

export interface SignedTransactionResult {
  rawTransaction: Uint8Array<ArrayBufferLike>;
  signedRawTransaction: string;
}

export function isSignedAndSentTransactionResult(
  signedTransaction: SignedTransaction,
): signedTransaction is BroadcastedTransactionResult {
  return "hash" in signedTransaction;
}

export function isTransactionResult(
  signedTransaction: any,
): signedTransaction is SignedTransactionResult {
  return (
    "rawTransaction" in signedTransaction &&
    "signedRawTransaction" in signedTransaction
  );
}
