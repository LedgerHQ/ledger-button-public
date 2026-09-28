import {
  address,
  getBase58Decoder,
  getCompiledTransactionMessageDecoder,
  getCompiledTransactionMessageEncoder,
  getTransactionDecoder,
} from "@solana/kit";
import { describe, expect, it } from "vitest";

import {
  getSolanaMessageBytes,
  patchRecentBlockhash,
} from "./transactionUtils";

const ACCOUNT_KEY = new Uint8Array(32).fill(9);
const ORIGINAL_BLOCKHASH = new Uint8Array(32).fill(3);
const FEE_PAYER = address("11111111111111111111111111111111");

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

  it("replaces the lifetime token of a v1 compiled message", () => {
    const original = new Uint8Array(
      getCompiledTransactionMessageEncoder().encode({
        configMask: 0,
        configValues: [],
        header: {
          numReadonlyNonSignerAccounts: 0,
          numReadonlySignerAccounts: 0,
          numSignerAccounts: 1,
        },
        instructionHeaders: [],
        instructionPayloads: [],
        lifetimeToken: getBase58Decoder().decode(ORIGINAL_BLOCKHASH),
        numInstructions: 0,
        numStaticAccounts: 1,
        staticAccounts: [FEE_PAYER],
        version: 1,
      }),
    );
    const refreshed = new Uint8Array(32).fill(8);
    const patched = patchRecentBlockhash(original, refreshed);
    const decoded = getCompiledTransactionMessageDecoder().decode(patched);

    expect(decoded.version).toBe(1);
    expect(decoded.lifetimeToken).toBe(getBase58Decoder().decode(refreshed));
    expect(decoded.staticAccounts).toEqual([FEE_PAYER]);
  });

  it("rejects a blockhash that is not 32 bytes", () => {
    expect(() => patchRecentBlockhash(messageBytes, new Uint8Array(31))).toThrow(
      /32 bytes/,
    );
  });
});
