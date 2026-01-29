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
  ticker: string;
  name: string;
  balance: string;
};

export type FiatBalance = {
  value: string;
  currency: string;
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
