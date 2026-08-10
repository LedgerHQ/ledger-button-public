import type { SolanaCluster } from "@ledgerhq/ledger-wallet-provider-core";

export const SUPPORTED_CLUSTERS: SolanaCluster[] = [
  "devnet",
  "testnet",
  "mainnet",
];

export function isSupportedCluster(cluster: string): cluster is SolanaCluster {
  return SUPPORTED_CLUSTERS.includes(cluster as SolanaCluster);
}
