/**
 * Raw API response types from Alpaca account-operations endpoint
 * GET https://alpaca.api.ledger.com/v1/{network}/account/{address}/operations
 */

export type AlpacaAssetType = "native" | "erc20" | "erc721" | "erc1155";

export type AlpacaAsset = {
  type: AlpacaAssetType;
  assetReference?: string;
};

export type AlpacaOperationParty = {
  address: string;
  amount?: string;
  assetReference?: string;
  type?: AlpacaAssetType;
};

export type AlpacaOperationStatus = "confirmed" | "failed" | "pending";

export type AlpacaOperation = {
  hash: string;
  type: string;
  senders: AlpacaOperationParty[];
  recipients: AlpacaOperationParty[];
  value: string;
  asset: AlpacaAsset;
  date: string;
  blockTime?: string;
  blockHeight?: number;
  fee?: string;
  status?: AlpacaOperationStatus;
  errorMessage?: string;
};

export type AlpacaOperationsResponse = {
  data: AlpacaOperation[];
  token?: string;
};

/**
 * Options for fetching transaction history
 */
export type TransactionHistoryOptions = {
  batchSize?: number;
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
 * Semantic kind of the transaction inferred from the Alpaca operation type.
 */
export type TransactionKind =
  | "transfer"
  | "swap"
  | "approve"
  | "contract"
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
 * Transformed transaction item for display
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
  errorMessage?: string;
};

/**
 * Result type for the use case
 */
export type TransactionHistoryResult = {
  transactions: TransactionHistoryItem[];
  nextPageToken?: string;
};
