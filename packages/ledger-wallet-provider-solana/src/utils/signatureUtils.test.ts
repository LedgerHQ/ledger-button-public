import { address, getTransactionDecoder } from "@solana/kit";
import { describe, expect, it } from "vitest";

import { attachSolanaSignature } from "./signatureUtils";

const SIGNER = "11111111111111111111111111111111";
const ACCOUNT_KEY = new Uint8Array(32).fill(0);
const ORIGINAL_BLOCKHASH = new Uint8Array(32).fill(3);
const messageBytes = new Uint8Array([
  1,
  0,
  0,
  1,
  ...ACCOUNT_KEY,
  ...ORIGINAL_BLOCKHASH,
  0,
]);
const transaction = new Uint8Array([1, ...new Uint8Array(64), ...messageBytes]);
const signature = new Uint8Array(64).fill(7);

describe("attachSolanaSignature", () => {
  it("writes the device signature onto the original wire transaction", () => {
    const signed = attachSolanaSignature(transaction, SIGNER, signature);
    const decoded = getTransactionDecoder().decode(signed);

    expect(decoded.signatures[address(SIGNER)]).toEqual(signature);
    expect(Array.from(decoded.messageBytes.slice(36, 68))).toEqual(
      Array.from(ORIGINAL_BLOCKHASH),
    );
  });

  it("patches recentBlockhash so the returned message matches delayed signing", () => {
    const refreshedBlockhash = new Uint8Array(32).fill(8);
    const signed = attachSolanaSignature(
      transaction,
      SIGNER,
      signature,
      refreshedBlockhash,
    );
    const decoded = getTransactionDecoder().decode(signed);

    expect(decoded.signatures[address(SIGNER)]).toEqual(signature);
    expect(Array.from(decoded.messageBytes.slice(36, 68))).toEqual(
      Array.from(refreshedBlockhash),
    );
  });
});
