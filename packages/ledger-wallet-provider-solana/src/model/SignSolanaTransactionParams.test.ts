import { describe, expect, it } from "vitest";

import { isSignSolanaTransactionParams } from "./SignSolanaTransactionParams";

const ADDRESS = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

describe("isSignSolanaTransactionParams", () => {
  it.each([
    [
      "accepts a well-formed Solana transaction params object",
      {
        kind: "solana-transaction",
        address: ADDRESS,
        transaction: new Uint8Array([1, 2, 3]),
      },
      true,
    ],
    [
      "rejects EVM-style positional tuples",
      ["0x1234567890abcdef1234567890abcdef12345678", "0xdeadbeef"],
      false,
    ],
    [
      "rejects the Solana message params kind",
      {
        kind: "solana-message",
        address: ADDRESS,
        transaction: new Uint8Array([1, 2, 3]),
      },
      false,
    ],
    [
      "rejects an object missing the discriminating kind",
      { address: ADDRESS, transaction: new Uint8Array([1, 2, 3]) },
      false,
    ],
    [
      "rejects a transaction that is not a Uint8Array",
      {
        kind: "solana-transaction",
        address: ADDRESS,
        transaction: "not-bytes",
      },
      false,
    ],
    [
      "rejects an object missing the address",
      { kind: "solana-transaction", transaction: new Uint8Array([1, 2, 3]) },
      false,
    ],
    [
      "rejects an address that is not a string",
      {
        kind: "solana-transaction",
        address: 42,
        transaction: new Uint8Array([1, 2, 3]),
      },
      false,
    ],
    ["rejects a null value", null, false],
    ["rejects an undefined value", undefined, false],
    ["rejects a string value", "string", false],
    ["rejects a number value", 42, false],
    ["rejects an array value", [], false],
  ])("%s", (_description, input, expected) => {
    expect(isSignSolanaTransactionParams(input)).toBe(expected);
  });
});
