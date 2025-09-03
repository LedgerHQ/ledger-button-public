import { infer as ZodInfer, ZodError } from "zod";

import type { JSONRPCRequest } from "../web3-provider/model/EIPTypes.js";
import { ConfigResponseSchema } from "./schemas.js";

export type Blockchain = {
  name: string;
  chain_id: string;
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
