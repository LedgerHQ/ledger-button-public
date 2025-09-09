export function getChainIdFromCurrencyId(currencyId: string) {
  return MAPPING_TABLE[currencyId];
}

const MAPPING_TABLE: Record<string, string> = {
  ethereum: "1",
  arbitrum: "42161",
  avalanche: "43114",
  base: "8453",
  bsc: "56",
  linea: "59144",
  optimism: "10",
  polygon: "137",
  sonic: "36",
  zksync: "324",
  gnosis: "100",
};
