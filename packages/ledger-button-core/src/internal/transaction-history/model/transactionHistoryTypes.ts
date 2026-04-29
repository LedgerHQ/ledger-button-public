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
 * Transformed transaction item for display
 */
export type TransactionType = "sent" | "received";

export type TransactionHistoryItem = {
  hash: string;
  type: TransactionType;
  value: string;
  formattedValue: string;
  currencyName: string;
  ticker: string;
  timestamp: string;
  ledgerId?: string;
  fiatValue?: string;
  fiatCurrency?: string;
  explorerUrl?: string;
};

/**
 * Result type for the use case
 */
export type TransactionHistoryResult = {
  transactions: TransactionHistoryItem[];
  nextPageToken?: string;
};
