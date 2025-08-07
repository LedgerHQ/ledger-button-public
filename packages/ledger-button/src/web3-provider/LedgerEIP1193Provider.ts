/**
 * EIP-1193 Provider Interfaces
 * Implementation of the Ethereum Provider JavaScript API
 * @see https://eips.ethereum.org/EIPS/eip-1193
 */

export type RpcMethods =
  | "eth_accounts"
  | "eth_requestAccounts"
  | "eth_blockNumber"
  | "eth_call"
  | "eth_chainId"
  | "eth_estimateGas"
  | "eth_gasPrice"
  | "eth_getBalance"
  | "eth_sendRawTransaction"
  | "eth_sendTransaction"
  | "eth_sign"
  | "eth_signTransaction"
  | "net_version"
  | "personal_sign";

export interface RequestArguments {
  readonly method: RpcMethods;
  readonly params?: readonly unknown[] | object;
}

export interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
}

// Error codes as defined in EIP-1193
export const CommonEIP1193ErrorCode = {
  UserRejectedRequest: 4001,
  Unauthorized: 4100,
  UnsupportedMethod: 4200,
  Disconnected: 4900,
  ChainDisconnected: 4901,
  // Additional common error codes (JSON-RPC 2.0)
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
} as const;

export interface ProviderMessage {
  readonly type: string;
  readonly data: unknown;
}

export interface ProviderConnectInfo {
  readonly chainId: string;
}

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: "eip6963:announceProvider";
  detail: EIP6963ProviderDetail;
}

export interface EIP6963RequestProviderEvent extends Event {
  type: "eip6963:requestProvider";
}

export interface EIP1193Provider {
  request(args: RequestArguments): Promise<unknown>;
  on(eventName: string, listener: (...args: unknown[]) => void): this;
  removeListener(
    eventName: string,
    listener: (...args: unknown[]) => void,
  ): this;
  isConnected(): boolean;
}

// Standard Ethereum RPC method interfaces
export interface EthRequestAccountsResult {
  accounts: string[];
}

export interface EthSendTransactionParams {
  from: string;
  to?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  value?: string;
  data?: string;
  nonce?: string;
  type?: string;
  chainId?: string;
}

export type EthSignTransactionParams = EthSendTransactionParams;

export interface PersonalSignParams {
  message: string;
  address: string;
}

export interface EthSignTypedDataParams {
  address: string;
  typedData: {
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    domain: Record<string, unknown>;
    message: Record<string, unknown>;
  };
}

export interface WalletSwitchEthereumChainParams {
  chainId: string;
}

export interface WalletAddEthereumChainParams {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

// Provider events
export type ProviderEventMap = {
  connect: [ProviderConnectInfo];
  disconnect: [ProviderRpcError];
  chainChanged: [string];
  accountsChanged: [string[]];
  message: [ProviderMessage];
};

export type ProviderEvent = keyof ProviderEventMap;

// Chain information
export interface ChainInfo {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

export type GlobalEvents =
  | "eip6963:announceProvider"
  | "eip6963:requestProvider";
