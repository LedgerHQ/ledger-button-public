import { infer as ZodInfer, ZodError } from "zod";

import { ConfigResponseSchema } from "./schemas.js";

export type JSONRPCRequest = {
  readonly jsonrpc: string;
  readonly id: number;
  readonly method: string;
  readonly params: readonly unknown[] | object;
};

export type JsonRpcResponseSuccess = {
  id: number;
  jsonrpc: string;
  result: string | object;
};

export type JsonRpcResponseError = {
  id: number;
  jsonrpc: string;
  error: {
    code: number;
    message: string;
  };
};

export type JsonRpcResponse = JsonRpcResponseSuccess | JsonRpcResponseError;

export type Blockchain = {
  name: string;
  chainId: string;
};

export type BroadcastRequest = {
  blockchain: Blockchain;
  rpc: JSONRPCRequest;
};

export type AlpacaBroadcastResponse = {
  transactionIdentifier: string;
};

export type BroadcastResponse = JsonRpcResponse | AlpacaBroadcastResponse;

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

export function isAlpacaBroadcastResponse(
  value: unknown,
): value is AlpacaBroadcastResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "transactionIdentifier" in value
  );
}

export type ConfigRequest = {
  dAppIdentifier: string;
};

export type ConfigResponse = ZodInfer<typeof ConfigResponseSchema>;

export type BackendServiceError = Error;

export type ConfigResponseError = Error | ZodError;
