import type { Factory } from "inversify";
import { inject, injectable } from "inversify";
import { lastValueFrom } from "rxjs";

import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import type { ContextService } from "../../context/ContextService.js";
import { ledgerSyncModuleTypes } from "../../ledgersync/ledgerSyncModuleTypes.js";
import type { LedgerSyncService } from "../../ledgersync/service/LedgerSyncService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import type { Account, AccountService } from "../service/AccountService.js";
import { FetchAccountsUseCase } from "./fetchAccountsUseCase.js";

@injectable()
export class FetchSelectedAccountUseCase {
  private logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(ledgerSyncModuleTypes.LedgerSyncService)
    private readonly ledgerSyncService: LedgerSyncService,
    @inject(accountModuleTypes.AccountService)
    private readonly accountService: AccountService,
    @inject(accountModuleTypes.FetchAccountsUseCase)
    private readonly fetchAccountsUseCase: FetchAccountsUseCase,
  ) {
    this.logger = loggerFactory("FetchSelectedAccountUseCase");
  }

  async execute(): Promise<Account | undefined> {
    const context = this.contextService.getContext();
    if (!context.selectedAccount) {
      return undefined;
    }

    //Re-authenticate to get the right JWT for cloud sync
    await lastValueFrom(this.ledgerSyncService.authenticate());
    //Get account details from ledger sync (Ticker, Name)
    const accounts = await this.fetchAccountsUseCase.execute();
    this.logger.info("Accounts fetched", { accounts });
    const account = accounts.find(
      (a) => a.freshAddress === context.selectedAccount?.freshAddress,
    );
    this.logger.info("Account from ledger sync", { account });

    //TODO handle this case when account is not found in Ledger Sync accounts
    if (!account) {
      this.logger.error("Selected account not found in Ledger Sync accounts", {
        address: context.selectedAccount?.freshAddress,
      });

      return undefined;
    }

    const accountWithBalanceAndTokens =
      await this.accountService.getBalanceAndTokensForAccount(account, true);

    this.contextService.onEvent({
      type: "account_changed",
      account: accountWithBalanceAndTokens as Account,
    });

    this.logger.info("Selected account fetched", {
      accountWithBalanceAndTokens,
    });
    return accountWithBalanceAndTokens;
  }
}
