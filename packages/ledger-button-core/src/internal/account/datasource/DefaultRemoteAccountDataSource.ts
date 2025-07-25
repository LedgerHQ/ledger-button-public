import { injectable } from "inversify";
import { Either } from "purify-ts";

import { AccountServiceError } from "../model/error.js";
import { CloudSyncData } from "../service/AccountService.js";
import { RemoteAccountDataSource } from "./RemoteAccountDataSource.js";

@injectable()
export class DefaultRemoteAccountDataSource implements RemoteAccountDataSource {
  fetchAccounts(): Promise<Either<AccountServiceError, CloudSyncData>> {
    throw new Error("Method not implemented.");
  }
}
