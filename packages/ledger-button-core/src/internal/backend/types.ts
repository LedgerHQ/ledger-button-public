import { infer as ZodInfer, ZodError } from "zod";

import type { JSONRPCRequest } from "../../api/model/eip/EIPTypes.js";
import { ConfigResponseSchema } from "./schemas.js";

export type Blockchain = {
  name: string;
  chainId: string;
};

export type BroadcastRequest = {
  blockchain: Blockchain;
  rpc: JSONRPCRequest;
};

export type BroadcastResponse = {
  result?: string;
  error?: {
    code: number;
    message: string;
  };
  id: number;
  jsonrpc: string;
};

export type ConfigRequest = {
  dAppIdentifier: string;
};

export type ConfigResponse = ZodInfer<typeof ConfigResponseSchema>;

export type BackendServiceError = Error;

export type ConfigResponseError = Error | ZodError;
