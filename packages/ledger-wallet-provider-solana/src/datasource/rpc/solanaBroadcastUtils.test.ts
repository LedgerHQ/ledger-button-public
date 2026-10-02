import { describe, expect, it } from "vitest";

import {
  buildGetLatestBlockhashRequest,
  buildSendTransactionRequest,
  decodeSolanaSignature,
  extractBroadcastedSignature,
  extractLatestBlockhash,
} from "./solanaBroadcastUtils";

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

describe("buildGetLatestBlockhashRequest", () => {
  it("requests a finalized latest blockhash", () => {
    expect(buildGetLatestBlockhashRequest(4)).toEqual({
      jsonrpc: "2.0",
      id: 4,
      method: "getLatestBlockhash",
      params: [{ commitment: "finalized" }],
    });
  });
});

describe("extractLatestBlockhash", () => {
  it("decodes the 32-byte blockhash from a JSON-RPC success payload", () => {
    expect(
      extractLatestBlockhash({
        id: 0,
        jsonrpc: "2.0",
        result: {
          context: { slot: 1 },
          value: {
            blockhash: "11111111111111111111111111111111",
            lastValidBlockHeight: 2,
          },
        },
      }),
    ).toEqual(new Uint8Array(32));
  });

  it("returns undefined for a JSON-RPC error", () => {
    expect(
      extractLatestBlockhash({
        id: 0,
        jsonrpc: "2.0",
        error: { code: -32000, message: "boom" },
      }),
    ).toBeUndefined();
  });
});
