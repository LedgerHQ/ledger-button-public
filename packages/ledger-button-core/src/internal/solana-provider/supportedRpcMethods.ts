/**
 * Wallet methods handled locally by the provider (not broadcasted to Node RPC)
 */
export const LOCALLY_HANDLED_WALLET_METHODS = [
  "connect",
  "disconnect",
  "signMessage",
  "signTransaction",
  "signAllTransactions",
  "sendTransaction",
] as const;

/**
 * RPC methods broadcasted to Solana node
 */
export const BROADCASTED_TO_NODE_RPC_METHODS = [
  "getBalance",
  "getLatestBlockhash",
  "getSignatureStatuses",
  "simulateTransaction",
  "sendRawTransaction",
] as const;

export const SUPPORTED_RPC_METHODS = [
  ...LOCALLY_HANDLED_WALLET_METHODS,
  ...BROADCASTED_TO_NODE_RPC_METHODS,
] as const;

export function isSupportedRpcMethod(method: string): boolean {
  return SUPPORTED_RPC_METHODS.includes(
    method as (typeof SUPPORTED_RPC_METHODS)[number],
  );
}
