import type { JSONRPCRequest } from "../web3-provider/model/EIPTypes.js";

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

export type SupportedBlockchain = {
  blockchain: string;
  chain_ids: string[];
};

export type AppDependency = {
  blockchain: string;
  appName: string;
  dependencies: string[];
};

export type ConfigResponse = {
  supportedBlockchains: SupportedBlockchain[];
  referralUrl: string;
  domainUrl: string;
  appDependencies: AppDependency[];
};

export type BackendServiceError = Error;
