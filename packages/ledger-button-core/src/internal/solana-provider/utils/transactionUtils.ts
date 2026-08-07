import { getTransactionDecoder } from "@solana/kit";

/**
 * Wallet Standard `solana:signTransaction` hands the wallet a fully serialized
 * wire transaction: a compact-u16 signature count, zero-filled signature slots,
 * then the compiled message. The Ledger Solana app signs the *compiled message*
 * only, so the signature envelope must be stripped before the bytes reach the
 * device — otherwise the app parses the signature prefix as the message header
 * and rejects the request with `6a80` ("Invalid data").
 */
export function getSolanaMessageBytes(wireTransaction: Uint8Array): Uint8Array {
  return new Uint8Array(
    getTransactionDecoder().decode(wireTransaction).messageBytes,
  );
}
