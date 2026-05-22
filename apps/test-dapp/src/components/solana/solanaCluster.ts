export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta";

export const SOLANA_CLUSTERS: { value: SolanaCluster; label: string }[] = [
  { value: "devnet", label: "Devnet" },
  { value: "testnet", label: "Testnet" },
  { value: "mainnet-beta", label: "Mainnet Beta" },
];

export const DEFAULT_SOLANA_CLUSTER: SolanaCluster = "devnet";
