import type { CurrencyNetworkRef } from "@api/blockchain-provider/model/CurrencyNetworkRef.js";
import type { SolanaCluster } from "@api/model/solana/SolanaTypes.js";

export const SOLANA_MAPPING_TABLE: Record<string, SolanaCluster> = {
  solana: "mainnet",
};

export const DEFAULT_SOLANA_CLUSTER: SolanaCluster = "mainnet";

export const SOLANA_NATIVE_DECIMALS = 9;

export const SOLANA_BLOCKCHAIN_NAME = "solana";

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

export function resolveSolanaNetwork(
  currencyId: string,
): CurrencyNetworkRef | undefined {
  if (!isSupportedSolanaCurrency(currencyId)) {
    return undefined;
  }
  return {
    networkId: getClusterFromCurrencyId(currencyId),
    blockchainName: SOLANA_BLOCKCHAIN_NAME,
  };
}

export function resolveSolanaCurrencyId(
  networkId: string,
): string | undefined {
  return getCurrencyIdFromCluster(networkId as SolanaCluster);
}
