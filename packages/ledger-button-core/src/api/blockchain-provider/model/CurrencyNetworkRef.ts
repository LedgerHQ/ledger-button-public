/**
 * Family-owned network identity used by core for CAL, RPC, and context
 * without importing chain-specific mapping tables.
 */
export type CurrencyNetworkRef = {
  /** Backend / UI network id (EVM chainId as string, Solana cluster, …) */
  networkId: string;
  /** ProviderBlockchain.name for RPC broadcast (e.g. "ethereum", "solana") */
  blockchainName: string;
};
