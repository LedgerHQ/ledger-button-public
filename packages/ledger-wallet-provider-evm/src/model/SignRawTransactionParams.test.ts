import { describe, expect, it } from "vitest";

import { isSignRawTransactionParams } from "./SignRawTransactionParams";

describe("isSignRawTransactionParams", () => {
  it.each(["eth_sendRawTransaction", "eth_signRawTransaction"])(
    "recognizes raw transaction method %s",
    (method) => {
      expect(
        isSignRawTransactionParams({
          transaction: "0xdeadbeef",
          method,
          broadcast: method === "eth_sendRawTransaction",
        }),
      ).toBe(true);
    },
  );

  it("rejects a non-string raw transaction", () => {
    expect(
      isSignRawTransactionParams({
        transaction: new Uint8Array(),
        method: "eth_sendRawTransaction",
        broadcast: true,
      }),
    ).toBe(false);
  });
});
