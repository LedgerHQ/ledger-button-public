import type { CurrencyNetworkRef } from "./CurrencyNetworkRef.js";
import type { BlockchainFamily } from "./types.js";

/**
 * Everything a blockchain family knows about a Ledger `currencyId` it owns,
 * resolved in a single lookup so core never reaches into family-specific chain
 * tables nor combines several per-field calls.
 */
export type CurrencyDescriptor = {
  currencyId: string;
  family: BlockchainFamily;
  network: CurrencyNetworkRef;
  /** Native decimals fallback when CAL has no metadata. */
  nativeDecimals: number;
};
