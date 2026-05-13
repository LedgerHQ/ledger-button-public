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
 * Transformed transaction item for display.
 */
export type TransactionHistoryItem = {
  hash: string;
  type: TransactionType;
  direction: TransactionDirection;
  kind: TransactionKind;
  status: TransactionStatus;
  value: string;
  formattedValue: string;
  currencyName: string;
  ticker: string;
  timestamp: string;
  blockHeight?: number;
  ledgerId?: string;
  fiatValue?: string;
  fiatCurrency?: string;
  explorerUrl?: string;
  fee?: string;
  formattedFee?: string;
  feeTicker?: string;
  fiatFee?: string;
};

/**
 * Result type for the use case.
 */
export type TransactionHistoryResult = {
  transactions: TransactionHistoryItem[];
  nextPageToken?: string;
};
