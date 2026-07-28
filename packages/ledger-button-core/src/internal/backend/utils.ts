import type {
  CoinServiceBroadcastResponse,
  JsonRpcResponse,
  JsonRpcResponseSuccess,
} from "./types.js";

export function isJsonRpcResponse(value: unknown): value is JsonRpcResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "jsonrpc" in value &&
    "id" in value &&
    ("result" in value || "error" in value)
  );
}

export function isJsonRpcResponseSuccess(
  value: unknown,
): value is JsonRpcResponseSuccess {
  return (
    typeof value === "object" &&
    value !== null &&
    "result" in value &&
    !("error" in value)
  );
}

export function isCoinServiceBroadcastResponse(
  value: unknown,
): value is CoinServiceBroadcastResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "transactionIdentifier" in value
  );
}
