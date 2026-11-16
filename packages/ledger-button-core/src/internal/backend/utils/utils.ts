import {
  type CoinServiceBroadcastResponse,
  type JsonRpcResponse,
  type JsonRpcResponseSuccess,
  RIPPLED_STATUSES,
  type RippledResponse,
  type RippledStatus,
} from "../model/types";

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

export function isRippledResponse(value: unknown): value is RippledResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("result" in value) ||
    "jsonrpc" in value
  ) {
    return false;
  }
  const { result } = value;
  return (
    typeof result === "object" &&
    result !== null &&
    "status" in result &&
    typeof result.status === "string" &&
    isRippledStatus(result.status)
  );
}

function isRippledStatus(status: string): status is RippledStatus {
  return RIPPLED_STATUSES.some((s) => s === status);
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
