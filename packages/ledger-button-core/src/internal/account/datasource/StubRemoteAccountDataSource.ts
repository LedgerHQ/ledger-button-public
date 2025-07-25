import { injectable } from "inversify";
import { Either, Right } from "purify-ts";

import { AccountServiceError } from "../model/error.js";
import { CloudSyncData } from "../service/AccountService.js";
import { RemoteAccountDataSource } from "./RemoteAccountDataSource.js";

@injectable()
export class StubRemoteAccountDataSource implements RemoteAccountDataSource {
  fetchAccounts(): Promise<Either<AccountServiceError, CloudSyncData>> {
    return Promise.resolve(
      Right({
        accounts: [
          {
            id: "js:2:ethereum:0xCb8Ac86ff74f6733C212E14e83461AC2b0cAD3d0:",
            currencyId: "ethereum",
            freshAddress: "0xCb8Ac86ff74f6733C212E14e83461AC2b0cAD3d0",
            seedIdentifier:
              "04abe1d261b0333c31f53e9e031da2c6ac2eb3da0219d03a62c771813b0560c4002ddaa02190477551bc5b10da6847901b1f3a4da72a363532e094771b9e1b0319",
            derivationMode: "",
            index: 0,
          },
        ],
        accountNames: {
          "js:2:ethereum:0xCb8Ac86ff74f6733C212E14e83461AC2b0cAD3d0:": "LBD 1",
        },
      }),
    );
  }
}
