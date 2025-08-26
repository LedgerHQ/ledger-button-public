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

export type Account = CloudSyncAccount & {
  name: string;
  ticker: string;
};
export interface AccountService {
  setAccountsFromCloudSyncData(accounts: CloudSyncData): void;
  getAccounts(): Account[];
  selectAccount(address: string): void;
  getSelectedAccount(): Account | null;
}
