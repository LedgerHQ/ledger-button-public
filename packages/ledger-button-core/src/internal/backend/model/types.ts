import { infer as ZodInfer, ZodError } from "zod";

import { ConfigResponseSchema } from "./schemas";

export type JSONRPCRequest = {
  readonly jsonrpc: string;
  readonly id: number;
  readonly method: string;
  readonly params: readonly unknown[] | object;
};

export type RippledRequest = {
  readonly method: string;
  readonly params: readonly Record<string, unknown>[];
};

export type BroadcastRpcRequest = JSONRPCRequest | RippledRequest;

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
  rpc: BroadcastRpcRequest;
};

export type CoinServiceBroadcastResponse = {
  transactionIdentifier: string;
};

export const RIPPLED_STATUSES = ["success", "error"] as const;

export type RippledStatus = (typeof RIPPLED_STATUSES)[number];

export type RippledResponse = {
  result: {
    status: RippledStatus;
    error?: string;
    error_code?: number;
    error_message?: string;
    [field: string]: unknown;
  };
};

export type BroadcastResponse =
  JsonRpcResponse | CoinServiceBroadcastResponse | RippledResponse;

export {
  isCoinServiceBroadcastResponse,
  isJsonRpcResponse,
  isJsonRpcResponseSuccess,
  isRippledResponse,
} from "../utils/utils";

export type ConfigRequest = {
  dAppIdentifier: string;
};

export type ConfigResponse = ZodInfer<typeof ConfigResponseSchema>;

export type BackendServiceError = Error;

export type ConfigResponseError = Error | ZodError;
