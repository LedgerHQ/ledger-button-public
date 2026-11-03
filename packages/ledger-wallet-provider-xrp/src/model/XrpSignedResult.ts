/**
 * Result of the XRP sign flow: what the device produced for one transaction.
 * The API assembles the signed `tx_blob` from it before returning to the dApp.
 */
export interface SignedXrpTransactionResult {
  /** DER-encoded ECDSA signature returned by the XRP app. */
  xrpSignature: Uint8Array;
  /** Public key (hex) the device signed with: the transaction's `SigningPubKey`. */
  signingPubKey: string;
}

/**
 * Results the XRP sign flow can emit. Owned by the XRP package; the shared
 * `SignedResults` transport union derives from it via the registry augmentation
 * below, so core never depends on this package.
 */
export type XrpSignedResult = SignedXrpTransactionResult;

export function isSignedXrpTransactionResult(
  signedTransaction: unknown,
): signedTransaction is SignedXrpTransactionResult {
  return (
    !!signedTransaction &&
    typeof signedTransaction === "object" &&
    "xrpSignature" in signedTransaction &&
    "signingPubKey" in signedTransaction
  );
}

declare module "@ledgerhq/ledger-wallet-provider-core" {
  interface SignedResultRegistry {
    xrp: XrpSignedResult;
  }
}
