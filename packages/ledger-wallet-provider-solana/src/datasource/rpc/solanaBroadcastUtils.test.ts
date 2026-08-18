import { describe, expect, it } from "vitest";

import {
  buildSendTransactionRequest,
  decodeSolanaSignature,
  extractBroadcastedSignature,
} from "./solanaBroadcastUtils.js";

describe("buildSendTransactionRequest", () => {
  it("wraps the wire transaction in a base64 sendTransaction request", () => {
    expect(buildSendTransactionRequest(3, "base64Tx")).toEqual({
      jsonrpc: "2.0",
      id: 3,
      method: "sendTransaction",
      params: ["base64Tx", { encoding: "base64" }],
    });
  });

  it("merges the caller options into the RPC config", () => {
    expect(
      buildSendTransactionRequest(0, "base64Tx", {
        skipPreflight: true,
        commitment: "finalized",
      }),
    ).toEqual({
      jsonrpc: "2.0",
      id: 0,
      method: "sendTransaction",
      params: [
        "base64Tx",
        { encoding: "base64", skipPreflight: true, commitment: "finalized" },
      ],
    });
  });
});

describe("extractBroadcastedSignature", () => {
  it("reads the identifier from a coin-service response", () => {
    expect(
      extractBroadcastedSignature({ transactionIdentifier: "sig123" }),
    ).toBe("sig123");
  });

  it("reads the result from a JSON-RPC success response", () => {
    expect(
      extractBroadcastedSignature({ id: 0, jsonrpc: "2.0", result: "sig123" }),
    ).toBe("sig123");
  });

  it("returns undefined for a JSON-RPC error response", () => {
    expect(
      extractBroadcastedSignature({
        id: 0,
        jsonrpc: "2.0",
        error: { code: -32000, message: "boom" },
      }),
    ).toBeUndefined();
  });
});

describe("decodeSolanaSignature", () => {
  it("decodes a base58 signature into its raw bytes", () => {
    expect(Array.from(decodeSolanaSignature("2g"))).toEqual([97]);
  });
});
