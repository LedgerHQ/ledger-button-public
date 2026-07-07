import { SolanaAppCommandError } from "@ledgerhq/device-signer-kit-solana/internal/app-binder/command/utils/SolanaApplicationErrors.js";
import { getBase58Decoder, getBase58Encoder } from "@solana/kit";

import { UserRejectedTransactionError } from "../../../api/errors/DeviceErrors.js";

/**
 * APDU status word returned by the Solana app when the user rejects the
 * on-device confirmation of an off-chain message.
 */
const USER_REJECTED_APDU_CODE = "6985";

/** Length in bytes of an ed25519 signature. */
const SIGNATURE_LENGTH = 64;

/** Leading version byte of a serialized off-chain message (OCM) envelope. */
const OCM_ENVELOPE_VERSION_BYTE = 1;

/**
 * Translates the Solana app's user-rejection APDU (`6985`) into the shared
 * `UserRejectedTransactionError` so the UI surfaces the rejection consistently
 * with EVM. Other errors are passed through untouched.
 */
export function normalizeSigningError(error: unknown): unknown {
  if (
    error instanceof SolanaAppCommandError &&
    error.errorCode === USER_REJECTED_APDU_CODE
  ) {
    return new UserRejectedTransactionError("User rejected message signing");
  }
  return error;
}

/**
 * Extracts the raw ed25519 signature from a Solana off-chain message signing
 * result.
 *
 * The Solana signer kit returns either:
 * - a bare 64-byte signature (Raw mode), or
 * - an OCM envelope `[versionByte][signature(64)][message...]` (V0/V1/Legacy).
 *
 * In both cases we return the base58 of the 64-byte signature so consumers
 * (e.g. the Wallet Standard wallet) receive a standard Solana signature.
 */
export function extractRawSignatureBase58(envelopeBase58: string): string {
  const bytes = new Uint8Array(getBase58Encoder().encode(envelopeBase58));

  if (bytes.length === SIGNATURE_LENGTH) {
    return envelopeBase58;
  }

  if (
    bytes.length >= 1 + SIGNATURE_LENGTH &&
    bytes[0] === OCM_ENVELOPE_VERSION_BYTE
  ) {
    const signature = bytes.slice(1, 1 + SIGNATURE_LENGTH);
    return getBase58Decoder().decode(signature);
  }

  throw new Error(
    `Unexpected off-chain message signature payload (${bytes.length} bytes)`,
  );
}

/**
 * Extracts the off-chain message (OCM) that was actually signed from a Solana
 * off-chain message signing envelope.
 *
 * The signer kit returns an OCM envelope `[versionByte][signature(64)][ocm...]`
 * for the V0/V1/Legacy signing modes. The trailing `ocm` bytes are the exact
 * byte string (preamble + content) that the device ed25519-signed, so a dApp
 * can verify the signature with `ed25519.verify(signature, signedMessage)`.
 *
 * Because these bytes come straight from the envelope, they reflect whichever
 * version the firmware ended up using (including any V1 -> V0 -> Legacy
 * fallback), which reconstructing the OCM client-side could not guarantee.
 */
export function extractSignedMessage(envelopeBase58: string): Uint8Array {
  const bytes = new Uint8Array(getBase58Encoder().encode(envelopeBase58));

  if (
    bytes.length > 1 + SIGNATURE_LENGTH &&
    bytes[0] === OCM_ENVELOPE_VERSION_BYTE
  ) {
    return bytes.slice(1 + SIGNATURE_LENGTH);
  }

  throw new Error(
    `Unexpected off-chain message envelope payload (${bytes.length} bytes)`,
  );
}
