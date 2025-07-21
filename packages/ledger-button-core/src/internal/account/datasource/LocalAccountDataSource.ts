import { Either } from "purify-ts";

import { Account } from "../service/AccountService.js";

export interface LocalAccountDataSource {
  fetchAccounts(): Promise<Either<Error, Account[]>>;
}
