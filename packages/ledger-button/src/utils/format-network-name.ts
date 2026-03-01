const NETWORK_DISPLAY_NAMES: Record<string, string> = {
  arbitrum: "Arbitrum",
  avalanche_c_chain: "Avalanche",
  base: "Base",
  bsc: "Binance Smart Chain",
  ethereum: "Ethereum",
  linea: "Linea",
  optimism: "Optimism",
  polygon: "Polygon",
  sonic: "Sonic",
  zksync: "zkSync",
};

export function formatNetworkName(currencyId: string): string {
  return (
    NETWORK_DISPLAY_NAMES[currencyId] ??
    currencyId.charAt(0).toUpperCase() + currencyId.slice(1)
  );
}
