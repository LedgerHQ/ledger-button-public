import { describe, expect, it } from "vitest";

import { isSignPersonalMessageParams } from "./SignPersonalMessageParams";

describe("isSignPersonalMessageParams", () => {
  it.each(["eth_sign", "personal_sign"])(
    "recognizes personal-message method %s",
    (method) => {
      expect(isSignPersonalMessageParams(["0x1234", "hello", method])).toBe(
        true,
      );
    },
  );

  it("recognizes a personal message supplied as bytes", () => {
    expect(
      isSignPersonalMessageParams([
        "0x1234",
        new Uint8Array([1, 2, 3]),
        "personal_sign",
      ]),
    ).toBe(true);
  });

  it("rejects malformed personal-message params", () => {
    expect(
      isSignPersonalMessageParams(["0x1234", "hello", "eth_signTypedData"]),
    ).toBe(false);
  });
});
