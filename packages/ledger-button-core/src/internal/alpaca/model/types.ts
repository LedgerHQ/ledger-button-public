export interface EvmChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  explorerUrl?: string;
  isTestnet?: boolean;
}

export interface TokenBalance {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  standard: "ERC20" | "ERC721" | "ERC1155";
}

export interface NativeBalance {
  symbol: string;
  balance: string;
  balanceFormatted: string;
}

export interface AlpacaBalanceResponse {
  address: string;
  chainId: number;
  nativeBalance: NativeBalance;
  tokenBalances: TokenBalance[];
  lastUpdated: number;
}

export interface AlpacaBalanceRequest {
  address: string;
  currencyId: string;
}

export const SUPPORTED_EVM_CHAINS: Record<string, EvmChainConfig> = {
  ethereum: {
    chainId: 1,
    name: "Ethereum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrl: "https://eth-mainnet.alchemyapi.io/v2/",
  },
};
