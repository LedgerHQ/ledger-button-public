import type {
  TransactionDirection,
  TransactionHistoryItem,
} from "../../../api/model/TransactionHistory.js";

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

export type TransactionHistoryResult = {
  transactions: TransactionHistoryItem[];
  transactionExplorerUrlTemplate?: string;
  nextPageToken?: string;
};
