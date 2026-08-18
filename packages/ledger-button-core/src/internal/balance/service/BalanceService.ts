import { Either } from "purify-ts";

import type { Account } from "@api/model/Account";

import { type AccountBalance } from "../model/types";

export interface BalanceService {
  getBalanceForAccount(
    account: Account,
    withTokens: boolean,
  ): Promise<Either<Error, AccountBalance>>;
}
