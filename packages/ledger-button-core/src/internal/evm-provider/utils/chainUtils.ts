import type { CurrencyNetworkRef } from "@api/blockchain-provider/model/CurrencyNetworkRef.js";

export const EVM_NATIVE_DECIMALS = 18;

export const EVM_BLOCKCHAIN_NAME = "ethereum";

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

export function resolveEvmNetwork(
  currencyId: string,
): CurrencyNetworkRef | undefined {
  if (!isSupportedEvmCurrency(currencyId)) {
    return undefined;
  }
  return {
    networkId: String(getChainIdFromCurrencyId(currencyId)),
    blockchainName: EVM_BLOCKCHAIN_NAME,
  };
}

export function resolveEvmCurrencyId(networkId: string): string | undefined {
  const chainId = Number(networkId);
  if (!Number.isFinite(chainId)) {
    return undefined;
  }
  return getCurrencyIdFromChainId(chainId);
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
