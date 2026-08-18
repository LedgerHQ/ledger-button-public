import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import type { Account, CloudSyncAccount } from "@api/model/Account";

export type CloudSyncData = {
  accounts: CloudSyncAccount[];
  accountNames: Record<string, string>;
};

export type AccountUpdate = {
  accountId: string;
  account: Account;
};

export interface AccountService {
  getBalanceAndTokensForAccount(
    account: Account,
    withTokens: boolean,
  ): Promise<Account>;
  setAccountsFromCloudSyncData(accounts: CloudSyncData): Promise<void>;
  getAccounts(): Account[];
  setAccounts(accounts: Account[]): void;
  selectAccount(account: Account, family: BlockchainFamily): void;
}
