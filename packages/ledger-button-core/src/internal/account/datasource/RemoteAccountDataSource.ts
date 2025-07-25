import { Either } from "purify-ts";

import { AccountServiceError } from "../model/error.js";
import { CloudSyncData } from "../service/AccountService.js";

export interface RemoteAccountDataSource {
  fetchAccounts(): Promise<Either<AccountServiceError, CloudSyncData>>;
}
