import type {
  BlockchainFamily,
  CurrencyDescriptor,
  SolanaCluster,
} from "@ledgerhq/ledger-wallet-provider-core";

export const SOLANA_MAPPING_TABLE: Record<string, SolanaCluster> = {
  solana: "mainnet",
};

export const DEFAULT_SOLANA_CLUSTER: SolanaCluster = "mainnet";

export const SOLANA_NATIVE_DECIMALS = 9;

export const SOLANA_FAMILY: BlockchainFamily = "solana";

export function getClusterFromCurrencyId(currencyId: string): SolanaCluster {
  return SOLANA_MAPPING_TABLE[currencyId] ?? DEFAULT_SOLANA_CLUSTER;
}

export function getCurrencyIdFromCluster(
  cluster: SolanaCluster,
): string | undefined {
  return Object.keys(SOLANA_MAPPING_TABLE).find(
    (currencyId) => SOLANA_MAPPING_TABLE[currencyId] === cluster,
  );
}

export function isSupportedSolanaCurrency(currencyId: string): boolean {
  return Object.hasOwn(SOLANA_MAPPING_TABLE, currencyId);
}

export function describeSolanaCurrency(
  currencyId: string,
): CurrencyDescriptor | undefined {
  if (!isSupportedSolanaCurrency(currencyId)) {
    return undefined;
  }
  return {
    currencyId,
    family: SOLANA_FAMILY,
    networkId: getClusterFromCurrencyId(currencyId),
    nativeDecimals: SOLANA_NATIVE_DECIMALS,
  };
}

export function describeSolanaNetwork(
  networkId: string,
): CurrencyDescriptor | undefined {
  const currencyId = getCurrencyIdFromCluster(networkId as SolanaCluster);
  return currencyId ? describeSolanaCurrency(currencyId) : undefined;
}
