import { describe, expect, test } from "vitest";

import { isBlockingRequestMethod } from "./isBlockingRequestMethod.js";

describe("isBlockingRequestMethod", () => {
  test.each([
    "eth_requestAccounts",
    "eth_accounts",
    "eth_signTypedData_v4",
    "personal_sign",
    "eth_sign",
    "eth_signTransaction",
    "eth_signRawTransaction",
    "eth_sendTransaction",
    "eth_sendRawTransaction",
  ])("should return true for blocking method: %s", (method) => {
    expect(isBlockingRequestMethod(method)).toBe(true);
  });

  test.each([
    "eth_chainId",
    "eth_call",
    "eth_getBalance",
    "eth_blockNumber",
    "eth_estimateGas",
    "wallet_switchEthereumChain",
    "eth_signTypedData",
    "unknown_method",
    "",
  ])("should return false for non-blocking method: %s", (method) => {
    expect(isBlockingRequestMethod(method)).toBe(false);
  });
});
