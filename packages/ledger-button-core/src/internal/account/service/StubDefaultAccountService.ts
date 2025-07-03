import { type Factory, inject, injectable } from "inversify";
import { Either, Left, Right } from "purify-ts";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { AccountServiceError, FetchAccountsError } from "../model/error.js";
import { Account, AccountService } from "./AccountService.js";

@injectable()
export class StubDefaultAccountService implements AccountService {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    private readonly loggerFactory: Factory<LoggerPublisher>,
  ) {
    this.logger = this.loggerFactory("[Account Service]");
  }

  async fetchAccounts(): Promise<Either<AccountServiceError, Account[]>> {
    try {
      this.logger.debug("Fetching accounts");

      // TODO: Get Type from Ledger Sync data
      const mockAccounts: Account[] = [
        {
          id: "account-1",
          name: "Account 1",
          address: "0x1234567890123456789012345678901234567890",
          balance: "1.5",
          derivationPath: "m/44'/60'/0'/0/0",
        },
        {
          id: "account-2",
          name: "Account 2",
          address: "0x0987654321098765432109876543210987654321",
          balance: "2.8",
          derivationPath: "m/44'/60'/0'/0/1",
        },
      ];

      this.logger.debug("Successfully fetched accounts", {
        count: mockAccounts.length,
      });
      return Right(mockAccounts);
    } catch (error) {
      this.logger.error("Failed to fetch accounts", { error });
      return Left(
        new FetchAccountsError(`Failed to fetch accounts`, { error }),
      );
    }
  }
}
