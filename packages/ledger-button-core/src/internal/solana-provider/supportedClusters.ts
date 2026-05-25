import type { SolanaCluster } from "../../api/model/solana/SolanaTypes.js";

export const SUPPORTED_CLUSTERS: SolanaCluster[] = [
  "devnet",
  "testnet",
  "mainnet-beta",
];

export function isSupportedCluster(cluster: string): cluster is SolanaCluster {
  return SUPPORTED_CLUSTERS.includes(cluster as SolanaCluster);
}
