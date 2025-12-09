/**
 * Standard Ethereum JSON-RPC methods
 * These are the standard methods as defined in the Ethereum JSON-RPC API and common wallet extensions.
 * @see https://ethereum.org/en/developers/docs/apis/json-rpc/
 */
export const STANDARD_JSON_RPC_METHODS = [
  // Account and chain queries
  "eth_accounts",
  "eth_requestAccounts",
  "eth_chainId",
  "eth_blockNumber",
  "eth_getBalance",
  "eth_getCode",
  "eth_estimateGas",
  "eth_call",
  // Signing and transaction operations
  "eth_sign",
  "personal_sign",
  "eth_signTypedData",
  "eth_signTypedData_v4",
  "eth_sendTransaction",
  "eth_signTransaction",
  "eth_signRawTransaction",
  "eth_sendRawTransaction",
] as const;

/**
 * EIP-specific methods (not part of the standard JSON-RPC API)
 * e.g., wallet_switchEthereumChain from EIP-3326
 * @see https://eips.ethereum.org/EIPS/eip-3326
 */
export const EIP_SPECIFIC_METHODS = ["wallet_switchEthereumChain"] as const;

export const SUPPORTED_RPC_METHODS = [
  ...STANDARD_JSON_RPC_METHODS,
  ...EIP_SPECIFIC_METHODS,
] as const;

export function isSupportedRpcMethod(method: string): boolean {
  return SUPPORTED_RPC_METHODS.includes(
    method as (typeof SUPPORTED_RPC_METHODS)[number],
  );
}
