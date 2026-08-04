/**
 * Lifecycle of a single broadcasted transaction, as surfaced to the UI.
 *
 * `processing` is emitted once core has registered the transaction in the
 * pending pool, which is also when `explorerUrl` becomes known. `validated` is
 * emitted when polling confirms the transaction settled on chain.
 */
export type BroadcastTracking = {
  hash: string;
  state: "processing" | "validated";
  explorerUrl?: string;
};
