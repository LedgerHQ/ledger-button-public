import { describe, expect, it } from "vitest";

import { isSignTransactionParams } from "./SignTransactionParams";

describe("isSignTransactionParams", () => {
  it.each(["eth_sendTransaction", "eth_signTransaction"])(
    "recognizes structured transaction method %s",
    (method) => {
      expect(
        isSignTransactionParams({
          transaction: {
            chainId: 1,
            data: "0x",
            to: "0x1234",
            value: "1",
          },
          method,
          broadcast: method === "eth_sendTransaction",
        }),
      ).toBe(true);
    },
  );

  it("rejects a structured transaction with an unsupported method", () => {
    expect(
      isSignTransactionParams({
        transaction: {},
        method: "solana:signTransaction",
        broadcast: false,
      }),
    ).toBe(false);
  });
});
