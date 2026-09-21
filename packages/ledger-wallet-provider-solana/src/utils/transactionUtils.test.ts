import { getTransactionDecoder } from "@solana/kit";
import { describe, expect, it } from "vitest";

import {
  getSolanaMessageBytes,
  hasOnlyPlaceholderSignatures,
  patchRecentBlockhash,
} from "./transactionUtils";

const ACCOUNT_KEY = new Uint8Array(32).fill(9);
const ORIGINAL_BLOCKHASH = new Uint8Array(32).fill(3);

/** Legacy compiled message: header, one account, blockhash, zero instructions. */
const messageBytes = new Uint8Array([
  1,
  0,
  0,
  1,
  ...ACCOUNT_KEY,
  ...ORIGINAL_BLOCKHASH,
  0,
]);

const placeholderWireTransaction = new Uint8Array([
  1,
  ...new Uint8Array(64),
  ...messageBytes,
]);

describe("getSolanaMessageBytes", () => {
  it("strips the signature envelope from a wire transaction", () => {
    expect(getSolanaMessageBytes(placeholderWireTransaction)).toEqual(
      messageBytes,
    );
  });
});

describe("hasOnlyPlaceholderSignatures", () => {
  it("is true when every signature slot is zero-filled", () => {
    expect(hasOnlyPlaceholderSignatures(placeholderWireTransaction)).toBe(true);
  });

  it("is false when a co-signer signature is already present", () => {
    const coSigned = new Uint8Array([
      1,
      ...new Uint8Array(64).fill(1),
      ...messageBytes,
    ]);
    expect(hasOnlyPlaceholderSignatures(coSigned)).toBe(false);
  });
});

describe("patchRecentBlockhash", () => {
  it("replaces the 32-byte recentBlockhash in a compiled message", () => {
    const refreshed = new Uint8Array(32).fill(8);
    const patched = patchRecentBlockhash(messageBytes, refreshed);
    const decoded = getTransactionDecoder().decode(
      new Uint8Array([1, ...new Uint8Array(64), ...patched]),
    );

    expect(patched).not.toEqual(messageBytes);
    expect(Array.from(decoded.messageBytes.slice(36, 68))).toEqual(
      Array.from(refreshed),
    );
  });

  it("rejects a blockhash that is not 32 bytes", () => {
    expect(() => patchRecentBlockhash(messageBytes, new Uint8Array(31))).toThrow(
      /32 bytes/,
    );
  });
});
