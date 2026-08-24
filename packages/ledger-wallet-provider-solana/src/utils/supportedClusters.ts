import type { SolanaCluster } from "../model/SolanaTypes";

export const SUPPORTED_CLUSTERS: SolanaCluster[] = [
  "devnet",
  "testnet",
  "mainnet",
];

export function isSupportedCluster(cluster: string): cluster is SolanaCluster {
  return SUPPORTED_CLUSTERS.includes(cluster as SolanaCluster);
}
