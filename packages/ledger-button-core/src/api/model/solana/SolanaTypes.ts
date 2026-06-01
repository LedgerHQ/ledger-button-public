export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta";

export type SolanaJSONRPCRequest = {
  readonly jsonrpc: string;
  readonly id: number;
  readonly method: string;
  readonly params: readonly unknown[] | object;
};

export type SolanaJsonRpcResponseSuccess = {
  id: number;
  jsonrpc: string;
  result: string | object;
};

export type SolanaJsonRpcResponseError = {
  id: number;
  jsonrpc: string;
  error: {
    code: number;
    message: string;
  };
};

export type SolanaJsonRpcResponse =
  | SolanaJsonRpcResponseSuccess
  | SolanaJsonRpcResponseError;

export const CommonSolanaErrorCode = {
  MethodNotFound: -32601,
} as const;
