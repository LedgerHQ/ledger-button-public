import { getTransactionDecoder } from "@solana/kit";

const ACCOUNT_KEY_LENGTH = 32;
const BLOCKHASH_LENGTH = 32;
const MESSAGE_HEADER_LENGTH = 3;
const VERSIONED_MESSAGE_FLAG = 0x80;
const SHORTVEC_VALUE_MASK = 0x7f;
const SHORTVEC_CONTINUE_FLAG = 0x80;
const SHORTVEC_MAX_SHIFT = 35;
const SIGNATURE_LENGTH = 64;

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
 * Delayed signing refreshes `recentBlockhash`, which would invalidate any
 * signature already present. Only enable it when every slot is still a
 * placeholder (missing, null, or 64 zero bytes).
 */
export function hasOnlyPlaceholderSignatures(
  wireTransaction: Uint8Array,
): boolean {
  const { signatures } = getTransactionDecoder().decode(wireTransaction);
  return Object.values(signatures).every(isPlaceholderSignature);
}

/**
 * Replace the 32-byte `recentBlockhash` in a compiled Solana message (legacy
 * or v0). Used to reassemble the wire transaction the device actually signed
 * after delayed signing.
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
  const offset = locateBlockhashOffset(serializedMessage);
  const patched = new Uint8Array(serializedMessage);
  patched.set(newBlockhash, offset);
  return patched;
}

function isPlaceholderSignature(
  signature: ArrayLike<number> | null | undefined,
): boolean {
  if (!signature) {
    return true;
  }
  if (signature.length !== SIGNATURE_LENGTH) {
    return false;
  }
  for (let index = 0; index < signature.length; index += 1) {
    if (signature[index] !== 0) {
      return false;
    }
  }
  return true;
}

function locateBlockhashOffset(serializedMessage: Uint8Array): number {
  if (serializedMessage.length < MESSAGE_HEADER_LENGTH + 1) {
    throw new Error("Message too short to contain a valid header");
  }

  let offset = 0;
  const firstByte = serializedMessage[offset];
  if (firstByte !== undefined && (firstByte & VERSIONED_MESSAGE_FLAG) !== 0) {
    offset += 1;
  }
  offset += MESSAGE_HEADER_LENGTH;

  const { length: accountCount, size } = decodeShortVec(
    serializedMessage,
    offset,
  );
  offset += size;
  offset += accountCount * ACCOUNT_KEY_LENGTH;

  if (offset + BLOCKHASH_LENGTH > serializedMessage.length) {
    throw new Error("Message too short to contain a blockhash at expected offset");
  }
  return offset;
}

function decodeShortVec(
  bytes: Uint8Array,
  offset: number,
): { length: number; size: number } {
  let length = 0;
  let size = 0;
  let shift = 0;
  for (;;) {
    const current = bytes[offset + size];
    if (current === undefined) {
      throw new Error("shortvec decode overflow");
    }
    length |= (current & SHORTVEC_VALUE_MASK) << shift;
    size += 1;
    if ((current & SHORTVEC_CONTINUE_FLAG) === 0) {
      break;
    }
    shift += 7;
    if (shift >= SHORTVEC_MAX_SHIFT) {
      throw new Error("shortvec too long");
    }
  }
  return { length, size };
}
