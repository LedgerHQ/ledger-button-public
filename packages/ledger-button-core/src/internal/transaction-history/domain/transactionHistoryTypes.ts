/**
 * Normalized, provider-agnostic boundary types exposed by
 * `TransactionHistoryDataSource`. All wire-level decoding (Coin Service
 * specifics, `tx.*` nesting, FEES detection, asset discriminator, address
 * casing, value/timestamp resolution) is owned by the data source adapter so
 * use cases never see provider-shaped data.
 */

export type TransactionHistoryEntryAsset =
  | { isNative: true }
  | { isNative: false; contractAddress: string };

export type TransactionHistoryEntryFee = {
  amount: string;
  payer?: string;
};

export type TransactionHistoryEntry = {
  hash: string;
  value: string;
  senders: string[];
  recipients: string[];
  fee?: TransactionHistoryEntryFee;
  failed: boolean;
  blockHeight?: number;
  timestamp: string;
  asset: TransactionHistoryEntryAsset;
  /**
   * Domain-level direction hint from the adapter. Used as a fallback when
   * `senders`/`recipients` are empty (e.g. fee-only rows). The transformer
   * may still override this based on whether the user appears in
   * `senders`/`recipients`.
   */
  direction?: TransactionDirection;
  /**
   * True when the adapter has identified this row as representing only the
   * gas paid by a failed transaction (e.g. Coin Service `-FEES` rows).
   * Adapters whose provider does not emit separate fee rows must return
   * `false`.
   */
  isFeeOnlyOperation: boolean;
};

export type TransactionHistoryPage = {
  items: TransactionHistoryEntry[];
  nextPageToken?: string;
};

/**
 * Options for fetching transaction history.
 */
export type TransactionHistoryOptions = {
  pageToken?: string;
};

/**
 * Direction of the transaction relative to the user account.
 * - "sent": user is the sender
 * - "received": user is the recipient
 * - "self": user is both sender and recipient (e.g. self-transfer)
 */
export type TransactionDirection = "sent" | "received" | "self";

/**
 * Semantic kind of the transaction inferred from the underlying operation.
 *
 * - "fees": a separate fee-only operation (e.g. a row paired with a failed
 *   parent transaction). Distinct from `"contract"` so the UI can render
 *   gas-only rows differently from real contract interactions.
 */
export type TransactionKind =
  | "transfer"
  | "swap"
  | "approve"
  | "contract"
  | "fees"
  | "unknown";

/**
 * On-chain status of the transaction.
 */
export type TransactionStatus = "confirmed" | "failed" | "pending";

/**
 * Back-compat alias kept for the existing UI which still consumes a binary
 * sent/received distinction. Prefer `TransactionDirection` for new code.
 */
export type TransactionType = "sent" | "received";

/**
 * Asset metadata attached to a transaction's value (and to its fee when the
 * fee is paid in a different asset). All formatting is deferred to the
 * presentation layer; consumers receive raw values and these decimals.
 */
export type TransactionHistoryItemAsset = {
  ledgerId: string;
  name: string;
  ticker: string;
  decimals: number;
};

export type TransactionHistoryItemFee = {
  /** Raw fee amount in the asset's smallest unit. */
  amount: string;
  asset: TransactionHistoryItemAsset;
  /** Fiat-converted fee amount, populated after fiat hydration. */
  fiatAmount?: string;
};

/**
 * Domain shape of a transaction returned by the use case. Carries raw values
 * and asset metadata only; the presentation layer is responsible for
 * formatting, explorer URL substitution, and any locale-aware display.
 */
export type TransactionHistoryItem = {
  hash: string;
  type: TransactionType;
  direction: TransactionDirection;
  kind: TransactionKind;
  status: TransactionStatus;
  /** Raw value of the transferred asset, in its smallest unit. */
  value: string;
  asset: TransactionHistoryItemAsset;
  timestamp: string;
  blockHeight?: number;
  /** Fiat-converted value, populated after fiat hydration. */
  fiatValue?: string;
  fiatCurrency?: string;
  fee?: TransactionHistoryItemFee;
};

/**
 * Result type for the use case. The explorer URL template is per-currency,
 * not per-transaction, so it lives at the page level; the presentation layer
 * substitutes `${hash}` for each item.
 */
export type TransactionHistoryResult = {
  transactions: TransactionHistoryItem[];
  transactionExplorerUrlTemplate?: string;
  nextPageToken?: string;
};
