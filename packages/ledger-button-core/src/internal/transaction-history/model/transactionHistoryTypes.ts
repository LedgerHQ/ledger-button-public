/**
 * Raw API response types from Ledger Explorer API
 * GET https://explorers.api.live.ledger.com/blockchain/v4/{blockchain}/address/{address}/txs
 */

export type ExplorerBlockInfo = {
  hash: string;
  height: number;
  time: string;
};

export type ExplorerTransactionInput = {
  output_hash: string;
  output_index: number;
  input_index: number;
  value: string;
  address: string;
  sequence: number;
};

export type ExplorerTransactionOutput = {
  output_index: number;
  value: string;
  address: string;
  script_hex: string;
};

export type ExplorerTransaction = {
  hash: string;
  received_at: string;
  lock_time: number;
  fees: string;
  inputs: ExplorerTransactionInput[];
  outputs: ExplorerTransactionOutput[];
  block?: ExplorerBlockInfo;
  confirmations: number;
};

export type ExplorerResponse = {
  truncated: boolean;
  txs: ExplorerTransaction[];
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
  timestamp: string;
};

/**
 * Result type for the use case
 */
export type TransactionHistoryResult = {
  transactions: TransactionHistoryItem[];
  nextPageToken?: string;
};
