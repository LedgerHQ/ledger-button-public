import type { TransactionHistoryItem } from "./TransactionHistory.js";

export type CloudSyncAccount = {
  id: string;
  currencyId: string;
  freshAddress: string;
  seedIdentifier: string;
  derivationMode: string;
  index: number;
};

export type Account = CloudSyncAccount & {
  name: string;
  ticker: string;
  balance: string | undefined;
  tokens: Token[];
};

export type Token = {
  ledgerId: string;
  ticker: string;
  name: string;
  balance: string;
  fiatBalance: FiatBalance | undefined;
};

export type FiatBalance = {
  value: string;
  currency: string;
};

export type LoadingState = "loading" | "loaded" | "error";

export type AccountWithFiat = Account & {
  fiatBalance: FiatBalance | undefined;
  fiatError: boolean;
  balanceLoadingState: LoadingState;
  fiatLoadingState: LoadingState;
};

export type Network = {
  id: string; // currencyId
  name: string;
  ticker?: string;
  fiatBalance?: FiatBalance;
};

export type DetailedAccount = Account & {
  fiatBalance: FiatBalance | undefined;
  transactionHistory: TransactionHistoryItem[] | undefined;
  /**
   * Per-currency explorer URL template (with a `${hash}` placeholder) that the
   * presentation layer expands into a clickable URL for each transaction.
   */
  transactionExplorerUrlTemplate?: string;
  totalFiatValue?: FiatBalance;
  networks: Network[];
};
