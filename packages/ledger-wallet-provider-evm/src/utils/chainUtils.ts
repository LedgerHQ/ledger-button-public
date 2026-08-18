import type {
  BlockchainFamily,
  CurrencyDescriptor,
} from "@ledgerhq/ledger-wallet-provider-core";

export const EVM_NATIVE_DECIMALS = 18;

export const EVM_FAMILY: BlockchainFamily = "ethereum";

export function getChainIdFromCurrencyId(currencyId: string): number {
  return EVM_MAPPING_TABLE[currencyId] ?? 1;
}

export function getCurrencyIdFromChainId(chainId: number): string | undefined {
  return Object.keys(EVM_MAPPING_TABLE).find(
    (currencyId) => EVM_MAPPING_TABLE[currencyId] === chainId,
  );
}

export function isSupportedEvmCurrency(currencyId: string): boolean {
  return Object.hasOwn(EVM_MAPPING_TABLE, currencyId);
}

export function describeEvmCurrency(
  currencyId: string,
): CurrencyDescriptor | undefined {
  if (!isSupportedEvmCurrency(currencyId)) {
    return undefined;
  }
  return {
    currencyId,
    family: EVM_FAMILY,
    networkId: String(getChainIdFromCurrencyId(currencyId)),
    nativeDecimals: EVM_NATIVE_DECIMALS,
  };
}

export function describeEvmNetwork(
  networkId: string,
): CurrencyDescriptor | undefined {
  const chainId = Number(networkId);
  if (!Number.isFinite(chainId)) {
    return undefined;
  }
  const currencyId = getCurrencyIdFromChainId(chainId);
  return currencyId ? describeEvmCurrency(currencyId) : undefined;
}

export const EVM_MAPPING_TABLE: Record<string, number> = {
  ethereum: 1,
  arbitrum: 42161,
  avalanche_c_chain: 43114,
  base: 8453,
  bsc: 56,
  linea: 59144,
  optimism: 10,
  polygon: 137,
  sonic: 146,
  zksync: 324,
  robinhood: 4663,
};
