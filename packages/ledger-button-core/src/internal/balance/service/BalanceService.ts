import { Either } from "purify-ts";

import type { Account } from "@api/model/Account.js";

import { type AccountBalance } from "../model/types.js";

export interface BalanceService {
  getBalanceForAccount(
    account: Account,
    withTokens: boolean,
  ): Promise<Either<Error, AccountBalance>>;
}
