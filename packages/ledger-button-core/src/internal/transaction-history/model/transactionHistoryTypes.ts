/**
 * Raw API response types for the Alpaca v3 account-operations endpoint.
 * GET https://alpaca.api.ledger.com/v1/{network}/account/{address}/operations
 *
 * Source of truth: Alpaca v3 OpenAPI spec.
 */

export type AlpacaAddress = string;

export type AlpacaAsset = {
  type: string;
  assetReference?: string;
  assetOwner?: AlpacaAddress;
};

export type AlpacaBlockInfo = {
  height: number;
  hash?: string;
  time?: string;
  parent?: AlpacaBlockInfo;
};

export type AlpacaOperationTransaction = {
  hash: string;
  fees: string;
  block: AlpacaBlockInfo;
  failed: boolean;
  date?: string;
  // Non-spec but present in EVM payloads; kept optional.
  feesPayer?: AlpacaAddress;
};

/**
 * EVM-specific operation details. Per the spec, `details` is loosely typed
 * (`additionalProperties: true`), so every field here is optional.
 */
export type AlpacaEvmOperationDetails = {
  sequence?: string;
  ledgerOpType?: "OUT" | "IN";
  assetAmount?: string;
  assetSenders?: AlpacaAddress[];
  assetRecipients?: AlpacaAddress[];
  parentSenders?: AlpacaAddress[];
  parentRecipients?: AlpacaAddress[];
};

export type AlpacaOperation = {
  id: string;
  tx: AlpacaOperationTransaction;
  type: string;
  value: string;
  senders: AlpacaAddress[];
  recipients: AlpacaAddress[];
  asset?: AlpacaAsset;
  details?: AlpacaEvmOperationDetails;
};

export type AlpacaOperationsResponse = {
  items: AlpacaOperation[];
  next?: string;
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
 * Semantic kind of the transaction inferred from the Alpaca operation.
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
