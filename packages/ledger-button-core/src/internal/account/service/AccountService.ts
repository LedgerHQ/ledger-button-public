import { Either } from "purify-ts";

import { AccountServiceError } from "../model/error.js";

// NOTE: Temporary type, will be replaced with a more robust one
export type Account = {
  id: string;
  name: string;
  currencyId: string;
  freshAddress: string;
  seedIdentifier: string;
  derivationMode: string;
  index: number;
};

export interface AccountService {
  fetchAccounts(): Promise<Either<AccountServiceError, Account[]>>;
}
