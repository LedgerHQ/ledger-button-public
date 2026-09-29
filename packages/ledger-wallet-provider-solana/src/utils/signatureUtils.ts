import {
  address,
  getTransactionDecoder,
  getTransactionEncoder,
} from "@solana/kit";

import { patchRecentBlockhash } from "./transactionUtils";

/**
 * Reassembles a fully-signed Solana wire transaction from an unsigned (or
 * partially-signed) wire transaction and the raw 64-byte ed25519 signature
 * produced by the device for `signerAddress`.
 *
 * The device only returns the signature; the Wallet Standard
 * `solana:signTransaction` method must return the serialized signed
 * transaction, so we decode the wire bytes, set the signer's signature, and
 * re-encode. When delayed signing refreshed `recentBlockhash`, pass that
 * 32-byte hash so the returned message matches what was signed.
 */
export function attachSolanaSignature(
  transaction: Uint8Array,
  signerAddress: string,
  signature: Uint8Array,
  refreshedBlockhash?: Uint8Array,
): Uint8Array {
  const decoded = getTransactionDecoder().decode(transaction);
  const messageBytes = refreshedBlockhash
    ? patchRecentBlockhash(
        new Uint8Array(decoded.messageBytes),
        refreshedBlockhash,
      )
    : decoded.messageBytes;
  const signedTransaction = {
    ...decoded,
    messageBytes: messageBytes as typeof decoded.messageBytes,
    signatures: {
      ...decoded.signatures,
      [address(signerAddress)]: signature,
    } as typeof decoded.signatures,
  };
  return new Uint8Array(getTransactionEncoder().encode(signedTransaction));
}
