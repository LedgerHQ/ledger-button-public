import { describe, expect, it } from "vitest";

import { isSignSolanaMessageParams } from "./SignSolanaMessageParams.js";

describe("isSignSolanaMessageParams", () => {
  it("accepts a well-formed Solana message params object", () => {
    expect(
      isSignSolanaMessageParams({
        kind: "solana-message",
        address: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
        message: new Uint8Array([1, 2, 3]),
      }),
    ).toBe(true);
  });

  it("rejects EVM-style positional tuples", () => {
    expect(
      isSignSolanaMessageParams([
        "0x1234567890abcdef1234567890abcdef12345678",
        "Hello, Ledger!",
        "personal_sign",
      ]),
    ).toBe(false);
  });

  it("rejects objects missing the discriminating kind", () => {
    expect(
      isSignSolanaMessageParams({
        address: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
        message: new Uint8Array([1, 2, 3]),
      }),
    ).toBe(false);
  });

  it("rejects when the message is not a Uint8Array", () => {
    expect(
      isSignSolanaMessageParams({
        kind: "solana-message",
        address: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
        message: "hello",
      }),
    ).toBe(false);
  });

  it("rejects when the address is missing", () => {
    expect(
      isSignSolanaMessageParams({
        kind: "solana-message",
        message: new Uint8Array([1, 2, 3]),
      }),
    ).toBe(false);
  });

  it.each([null, undefined, "string", 42, []])(
    "rejects non-object value %p",
    (value) => {
      expect(isSignSolanaMessageParams(value)).toBe(false);
    },
  );
});
