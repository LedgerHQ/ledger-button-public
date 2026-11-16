const XRP_NETWORK_LABELS: Record<string, string> = {
  "0": "mainnet",
  "1": "testnet",
};

/** Formats an XRPL `network_id` for display, e.g. `"0"` → `"0 (mainnet)"`. */
export function formatXrpNetwork(network: string): string {
  const label = XRP_NETWORK_LABELS[network];
  return label ? `${network} (${label})` : network;
}
