import type { BlockchainFamily } from "./types";

/**
 * Everything a blockchain family knows about a Ledger `currencyId` it owns,
 * resolved in a single lookup so core never reaches into family-specific chain
 * tables nor combines several per-field calls.
 */
export type CurrencyDescriptor = {
  currencyId: string;
  /** Doubles as the blockchain name the backend expects for RPC calls. */
  family: BlockchainFamily;
  /** Backend / UI network id (EVM chainId as string, Solana cluster, …) */
  networkId: string;
  /** Native decimals fallback when CAL has no metadata. */
  nativeDecimals: number;
};
