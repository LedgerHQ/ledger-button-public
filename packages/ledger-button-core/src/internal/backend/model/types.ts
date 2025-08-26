export type Blockchain = {
  name: string;
  chain_id: string;
};

export type RpcRequest = {
  method: string;
  params: unknown[];
  id: number;
  jsonrpc: string;
};

export type BroadcastRequest = {
  blockchain: Blockchain;
  rpc: RpcRequest;
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

export type BackendErrorResponse = {
  error: string;
  code: number;
};

export type BackendHeaders = {
  "Content-Type"?: string;
  "X-Ledger-client-origin": string;
  "X-Ledger-domain": string;
};

export type BackendServiceError = Error;
