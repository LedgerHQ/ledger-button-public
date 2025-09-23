export function getChainIdFromCurrencyId(currencyId: string) {
  return EVM_MAPPING_TABLE[currencyId] ?? "1";
}

export const EVM_MAPPING_TABLE: Record<string, string> = {
  ethereum: "1",
  arbitrum: "42161",
  avalanche: "43114",
  base: "8453",
  bsc: "56",
  linea: "59144",
  optimism: "10",
  polygon: "137",
  sonic: "146",
  zksync: "324",
  gnosis: "100",
};
