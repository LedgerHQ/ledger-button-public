import {
  isCoinServiceBroadcastResponse,
  isJsonRpcResponse,
  isJsonRpcResponseSuccess,
} from "./utils";

describe("isJsonRpcResponse", () => {
  it("should return true for a success response", () => {
    const value = { jsonrpc: "2.0", id: 1, result: "0x123" };
    expect(isJsonRpcResponse(value)).toBe(true);
  });

  it("should return true for an error response", () => {
    const value = {
      jsonrpc: "2.0",
      id: 1,
      error: { code: -32600, message: "Invalid Request" },
    };
    expect(isJsonRpcResponse(value)).toBe(true);
  });

  it("should return false when jsonrpc field is missing", () => {
    const value = { id: 1, result: "0x123" };
    expect(isJsonRpcResponse(value)).toBe(false);
  });

  it("should return false when id field is missing", () => {
    const value = { jsonrpc: "2.0", result: "0x123" };
    expect(isJsonRpcResponse(value)).toBe(false);
  });

  it("should return false when neither result nor error is present", () => {
    const value = { jsonrpc: "2.0", id: 1 };
    expect(isJsonRpcResponse(value)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isJsonRpcResponse(null)).toBe(false);
  });

  it("should return false for a non-object primitive", () => {
    expect(isJsonRpcResponse("string")).toBe(false);
    expect(isJsonRpcResponse(42)).toBe(false);
  });
});

describe("isJsonRpcResponseSuccess", () => {
  it("should return true when result is present and error is absent", () => {
    const value = { jsonrpc: "2.0", id: 1, result: "0x456" };
    expect(isJsonRpcResponseSuccess(value)).toBe(true);
  });

  it("should return false when error is present alongside result", () => {
    const value = {
      jsonrpc: "2.0",
      id: 1,
      result: "0x456",
      error: { code: -32600, message: "Invalid Request" },
    };
    expect(isJsonRpcResponseSuccess(value)).toBe(false);
  });

  it("should return false when result is absent", () => {
    const value = {
      jsonrpc: "2.0",
      id: 1,
      error: { code: -32600, message: "Invalid Request" },
    };
    expect(isJsonRpcResponseSuccess(value)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isJsonRpcResponseSuccess(null)).toBe(false);
  });

  it("should return false for a non-object primitive", () => {
    expect(isJsonRpcResponseSuccess("string")).toBe(false);
  });
});

describe("isCoinServiceBroadcastResponse", () => {
  it("should return true when transactionIdentifier is present", () => {
    const value = { transactionIdentifier: "abc123" };
    expect(isCoinServiceBroadcastResponse(value)).toBe(true);
  });

  it("should return false when transactionIdentifier is absent", () => {
    const value = { jsonrpc: "2.0", id: 1, result: "0x123" };
    expect(isCoinServiceBroadcastResponse(value)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isCoinServiceBroadcastResponse(null)).toBe(false);
  });

  it("should return false for a non-object primitive", () => {
    expect(isCoinServiceBroadcastResponse("abc123")).toBe(false);
    expect(isCoinServiceBroadcastResponse(42)).toBe(false);
  });
});
