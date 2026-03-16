import type { TransactionHistoryItem } from "../../transaction-history/model/transactionHistoryTypes.js";

export type CloudSyncAccount = {
  id: string;
  currencyId: string;
  freshAddress: string;
  seedIdentifier: string;
  derivationMode: string;
  index: number;
};

export type CloudSyncData = {
  accounts: CloudSyncAccount[];
  accountNames: Record<string, string>;
};

//TODO Move account and token to API models
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

export type AccountUpdate = {
  accountId: string;
  account: Account;
};

export type LoadingState = "loading" | "loaded" | "error";

export type AccountWithFiat = Account & {
  fiatBalance: FiatBalance | undefined;
  fiatError: boolean;
  balanceLoadingState: LoadingState;
  fiatLoadingState: LoadingState;
};

export type Network = {
  id: string; // EVM Chain ID
  name: string;
};

export type DetailedAccount = Account & {
  fiatBalance: FiatBalance | undefined;
  transactionHistory: TransactionHistoryItem[] | undefined;
  totalFiatValue?: FiatBalance;
  networks: Network[];
};

export interface AccountService {
  getBalanceAndTokensForAccount(
    account: Account,
    withTokens: boolean,
  ): Promise<Account>;
  setAccountsFromCloudSyncData(accounts: CloudSyncData): Promise<void>;
  getAccounts(): Account[];
  setAccounts(accounts: Account[]): void;
  selectAccount(account: Account): void;
  getSelectedAccount(): Account | null;
}
