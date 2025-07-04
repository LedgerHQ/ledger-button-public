import { type Factory, inject, injectable } from "inversify";
import { Either, Right } from "purify-ts";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { AccountServiceError } from "../model/error.js";
import { AccountService, FetchAccountsResponse } from "./AccountService.js";

@injectable()
export class StubDefaultAccountService implements AccountService {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = this.loggerFactory("[Account Service]");
  }

  async fetchAccounts(): Promise<
    Either<AccountServiceError, FetchAccountsResponse>
  > {
    this.logger.debug("Fetching accounts");

    // NOTE: Data returned by Ledger Sync: Cloud Sync API
    // TODO: We should do the reconciliation with the accountNames before returning the response

    // const mockData = {
    //   accounts: [
    //     {
    //       id: "js:2:ethereum:0xCb8Ac86ff74f6733C212E14e83461AC2b0cAD3d0:",
    //       currencyId: "ethereum",
    //       freshAddress: "0xCb8Ac86ff74f6733C212E14e83461AC2b0cAD3d0",
    //       seedIdentifier:
    //         "04abe1d261b0333c31f53e9e031da2c6ac2eb3da0219d03a62c771813b0560c4002ddaa02190477551bc5b10da6847901b1f3a4da72a363532e094771b9e1b0319",
    //       derivationMode: "",
    //       index: 0,
    //     },
    //   ],
    //   accountNames: {
    //     "js:2:ethereum:0xCb8Ac86ff74f6733C212E14e83461AC2b0cAD3d0:": "LBD 1",
    //   },
    // };

    const accounts: FetchAccountsResponse = [
      {
        id: "js:2:ethereum:0xCb8Ac86ff74f6733C212E14e83461AC2b0cAD3d0:",
        name: "LBD 1",
        currencyId: "ethereum",
        freshAddress: "0xCb8Ac86ff74f6733C212E14e83461AC2b0cAD3d0",
        seedIdentifier:
          "04abe1d261b0333c31f53e9e031da2c6ac2eb3da0219d03a62c771813b0560c4002ddaa02190477551bc5b10da6847901b1f3a4da72a363532e094771b9e1b0319",
        derivationMode: "",
        index: 0,
      },
    ];

    this.logger.debug("Successfully fetched accounts", {
      count: accounts.length,
      accounts: accounts,
    });
    return Right(accounts);
  }
}
