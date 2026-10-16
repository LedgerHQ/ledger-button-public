import {
  bufferToHexaString,
  hexaStringToBuffer,
} from "@ledgerhq/device-management-kit";
import { encode } from "ripple-binary-codec";

/** An XRPL transaction as plain JSON (rippled's `tx_json`). */
export type XrpTransaction = Record<string, unknown>;

export type SignedXrpTransaction = {
  readonly tx_blob: string;
  readonly hash: string;
  readonly signature: string;
};

/** `TXN\0`: hash prefix of a signed transaction (its transaction ID). */
const TRANSACTION_ID_PREFIX = "54584E00";

/**
 * The transaction as the device must see it. A missing `SigningPubKey` makes
 * the XRP app switch to multi-signing, so it is always set.
 */
export function withSigningFields(
  tx: XrpTransaction,
  address: string,
  signingPubKey: string,
): XrpTransaction {
  return {
    ...tx,
    Account: address,
    SigningPubKey: signingPubKey.toUpperCase(),
  };
}

/**
 * Bytes sent to the signer kit. The XRP app prepends the `STX\0` signing prefix
 * itself, so this is `encode()` and not `encodeForSigning()`.
 */
export function serializeForDevice(unsignedTx: XrpTransaction): Uint8Array {
  const bytes = hexaStringToBuffer(encodeTransaction(unsignedTx));
  if (!bytes) {
    throw new Error("Could not serialize the XRP transaction");
  }
  return bytes;
}

/**
 * `encode` reports a bad numeric field as "Cannot construct UInt32 from given
 * value", without naming it. Name the field so the dApp can fix its transaction.
 */
function encodeTransaction(tx: XrpTransaction): string {
  try {
    return encode(tx);
  } catch (error) {
    const invalidField = findInvalidNumericField(tx);
    if (invalidField) {
      throw new Error(
        `Invalid XRP transaction field "${invalidField}": ${String(tx[invalidField])}`,
        { cause: error },
      );
    }
    throw error;
  }
}

function findInvalidNumericField(tx: XrpTransaction): string | undefined {
  return Object.keys(tx).find((key) => {
    const value = tx[key];
    return (
      value === null || (typeof value === "number" && !Number.isInteger(value))
    );
  });
}

export async function assembleSignedTransaction(
  unsignedTx: XrpTransaction,
  derSignature: Uint8Array,
): Promise<SignedXrpTransaction> {
  const signature = bufferToHexaString(derSignature, false).toUpperCase();
  const tx_blob = encodeTransaction({
    ...unsignedTx,
    TxnSignature: signature,
  });
  return { tx_blob, hash: await computeTransactionHash(tx_blob), signature };
}

/** SHA-512Half of the prefixed signed blob. */
export async function computeTransactionHash(txBlob: string): Promise<string> {
  const bytes = hexaStringToBuffer(TRANSACTION_ID_PREFIX + txBlob);
  if (!bytes) {
    throw new Error("Invalid XRP transaction blob");
  }
  const digest = await crypto.subtle.digest("SHA-512", Uint8Array.from(bytes));
  return bufferToHexaString(
    new Uint8Array(digest.slice(0, 32)),
    false,
  ).toUpperCase();
}
