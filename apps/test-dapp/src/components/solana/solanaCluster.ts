export type SolanaCluster = "devnet" | "testnet" | "mainnet";

export type SolanaChain = `solana:${SolanaCluster}`;

export const SOLANA_CLUSTERS: { value: SolanaCluster; label: string }[] = [
  { value: "devnet", label: "Devnet" },
  { value: "testnet", label: "Testnet" },
  { value: "mainnet", label: "Mainnet" },
];

export const DEFAULT_SOLANA_CLUSTER: SolanaCluster = "mainnet";

const RPC_URLS: Record<SolanaCluster, string> = {
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  // The public `api.mainnet-beta.solana.com` host rejects browser requests with
  // HTTP 403, so we use Ledger's CORS-enabled Solana RPC (the same endpoint the
  // Device Management Kit sample app uses) for mainnet.
  mainnet: "https://solana.coin.ledger.com",
};

export function getSolanaChain(cluster: SolanaCluster): SolanaChain {
  return `solana:${cluster}`;
}

export function getSolanaRpcUrl(cluster: SolanaCluster): string {
  return RPC_URLS[cluster];
}
