import {
  type CompiledTransactionMessage,
  getBase58Decoder,
  getCompiledTransactionMessageDecoder,
  getCompiledTransactionMessageEncoder,
  getTransactionDecoder,
} from "@solana/kit";
import { Maybe } from "purify-ts";

const BLOCKHASH_LENGTH = 32;
const COMPUTE_BUDGET_PROGRAM_ADDRESS =
  "ComputeBudget111111111111111111111111111111";

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
 * Resolve the recipient of a serialized transaction: decode its compiled message,
 * read the program each instruction calls, skip the Compute Budget program
 * (fee and compute-limit settings), and return the first remaining one.
 * Program addresses are always static accounts, so no address lookup table
 * needs to be fetched. Empty when the transaction cannot be decoded or only
 * calls the Compute Budget program.
 */
export function getSolanaTransactionRecipient(
  wireTransaction: Uint8Array,
): Maybe<string> {
  return Maybe.encase(() =>
    getCompiledTransactionMessageDecoder().decode(
      getSolanaMessageBytes(wireTransaction),
    ),
  ).chainNullable((compiled) =>
    getProgramIndices(compiled)
      .map((index) => compiled.staticAccounts[index])
      .find((program) => program !== COMPUTE_BUDGET_PROGRAM_ADDRESS),
  );
}

/**
 * Index, in the static accounts, of the program each instruction calls, in
 * instruction order. v1 messages keep it in the instruction headers, legacy
 * and v0 messages on the instructions themselves.
 */
function getProgramIndices(compiled: CompiledTransactionMessage): number[] {
  return compiled.version === 1
    ? compiled.instructionHeaders.map((header) => header.programAccountIndex)
    : compiled.instructions.map((instruction) => instruction.programAddressIndex);
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
