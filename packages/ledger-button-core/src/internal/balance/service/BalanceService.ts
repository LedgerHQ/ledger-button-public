import { Either } from "purify-ts";

import { Account } from "../../account/service/AccountService.js";
import { type AccountBalance } from "../model/types.js";

export interface BalanceService {
  getBalanceForAccount(
    account: Account,
  ): Promise<Either<Error, AccountBalance>>;
}
