import {
  getBase58Decoder,
  getCompiledTransactionMessageDecoder,
  getCompiledTransactionMessageEncoder,
  getTransactionDecoder,
} from "@solana/kit";

const BLOCKHASH_LENGTH = 32;

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

/**
 * Replace the lifetime token (recent blockhash) in a compiled Solana message.
 * `@solana/kit` codecs cover legacy, v0, and v1 layouts, including the v1
 * config mask that sits before the blockhash.
 *
 * Used to reassemble the wire transaction the device actually signed after
 * delayed signing.
 */
export function patchRecentBlockhash(
  serializedMessage: Uint8Array,
  newBlockhash: Uint8Array,
): Uint8Array {
  if (newBlockhash.byteLength !== BLOCKHASH_LENGTH) {
    throw new Error(
      `newBlockhash must be ${BLOCKHASH_LENGTH} bytes, got ${newBlockhash.byteLength}`,
    );
  }
  const compiled =
    getCompiledTransactionMessageDecoder().decode(serializedMessage);
  return new Uint8Array(
    getCompiledTransactionMessageEncoder().encode({
      ...compiled,
      lifetimeToken: getBase58Decoder().decode(newBlockhash),
    }),
  );
}
