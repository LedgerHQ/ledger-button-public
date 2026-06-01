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
  direction?: TransactionDirection;
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
  name: string | undefined;
  ticker: string;
  decimals: number;
};

export type TransactionHistoryItemFee = {
  amount: string;
  asset: TransactionHistoryItemAsset;
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
  value: string;
  asset: TransactionHistoryItemAsset;
  timestamp: string;
  blockHeight?: number;
  fiatValue?: string;
  fiatCurrency?: string;
  fee?: TransactionHistoryItemFee;
};

export type TransactionHistoryResult = {
  transactions: TransactionHistoryItem[];
  transactionExplorerUrlTemplate?: string;
  nextPageToken?: string;
};
