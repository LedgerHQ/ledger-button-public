export type SolanaCluster = "devnet" | "testnet" | "mainnet";

export type SolanaChain = `solana:${SolanaCluster}`;

export const SOLANA_CLUSTERS: { value: SolanaCluster; label: string }[] = [
  { value: "devnet", label: "Devnet" },
  { value: "testnet", label: "Testnet" },
  { value: "mainnet", label: "Mainnet" },
];

export const DEFAULT_SOLANA_CLUSTER: SolanaCluster = "devnet";

const RPC_URLS: Record<SolanaCluster, string> = {
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  // The mainnet cluster moniker is "mainnet" (per @solana/kit) but the public
  // RPC host is still served under the historical "mainnet-beta" domain.
  mainnet: "https://api.mainnet-beta.solana.com",
};

export function getSolanaChain(cluster: SolanaCluster): SolanaChain {
  return `solana:${cluster}`;
}

export function getSolanaRpcUrl(cluster: SolanaCluster): string {
  return RPC_URLS[cluster];
}
