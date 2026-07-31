import {
  address,
  getTransactionDecoder,
  getTransactionEncoder,
} from "@solana/kit";

/**
 * Reassembles a fully-signed Solana wire transaction from an unsigned (or
 * partially-signed) wire transaction and the raw 64-byte ed25519 signature
 * produced by the device for `signerAddress`.
 *
 * The device only returns the signature; the Wallet Standard
 * `solana:signTransaction` method must return the serialized signed
 * transaction, so we decode the wire bytes, set the signer's signature, and
 * re-encode.
 */
export function attachSolanaSignature(
  transaction: Uint8Array,
  signerAddress: string,
  signature: Uint8Array,
): Uint8Array {
  const decoded = getTransactionDecoder().decode(transaction);
  const signedTransaction = {
    ...decoded,
    signatures: {
      ...decoded.signatures,
      [address(signerAddress)]: signature,
    } as typeof decoded.signatures,
  };
  return new Uint8Array(getTransactionEncoder().encode(signedTransaction));
}
