import { type Factory, inject, injectable } from "inversify";
import {
  catchError,
  from,
  map,
  merge,
  Observable,
  of,
  scan,
  startWith,
  switchMap,
} from "rxjs";

import { type BlockchainFamily } from "../../../api/blockchain-provider/model/types.js";
import type { Account } from "../../../api/model/Account.js";
import { loggerModuleTypes } from "../../logger/di/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../di/accountModuleTypes.js";
import type {
  AccountService,
  AccountUpdate,
} from "../service/AccountService.js";
import { FetchAccountsUseCase } from "./fetchAccountsUseCase.js";
import { FilterAccountsByFamilyUseCase } from "./filterAccountsByFamilyUseCase.js";
import { HydrateAccountWithBalanceUseCase } from "./HydrateAccountWithBalanceUseCase.js";

@injectable()
export class FetchAccountsWithBalanceUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(accountModuleTypes.AccountService)
    private readonly accountService: AccountService,
    @inject(accountModuleTypes.FetchAccountsUseCase)
    private readonly fetchAccountsUseCase: FetchAccountsUseCase,
    @inject(accountModuleTypes.HydrateAccountWithBalanceUseCase)
    private readonly hydrateAccountWithBalanceUseCase: HydrateAccountWithBalanceUseCase,
    @inject(accountModuleTypes.FilterAccountsByFamilyUseCase)
    private readonly filterAccountsByFamilyUseCase: FilterAccountsByFamilyUseCase,
  ) {
    this.logger = loggerFactory("FetchAccountsWithBalanceUseCase");
  }

  execute(options?: {
    forceRefresh?: boolean;
    family?: BlockchainFamily;
  }): Observable<Account[]> {
    const existingAccounts = this.accountService.getAccounts();
    const accountsSource = this.shouldFetchFromCloudSync(
      existingAccounts,
      options,
    )
      ? from(this.fetchAccountsUseCase.execute())
      : of(existingAccounts);

    return accountsSource.pipe(
      switchMap((accounts) => {
        const scopedAccounts = this.filterAccountsByFamilyUseCase.execute(
          accounts,
          options?.family,
        );
        const initialAccounts =
          this.initializeAccountsWithEmptyBalances(scopedAccounts);

        if (initialAccounts.length === 0) {
          return of(initialAccounts);
        }

        const balanceObservables = initialAccounts.map((account) =>
          this.createBalanceObservable(account),
        );

        return merge(...balanceObservables).pipe(
          scan(
            (acc: Account[], update: AccountUpdate) =>
              this.mergeAccountUpdate(acc, update),
            initialAccounts,
          ),
          startWith(initialAccounts),
        );
      }),
    );
  }

  private shouldFetchFromCloudSync(
    cachedAccounts: Account[],
    options?: { forceRefresh?: boolean },
  ): boolean {
    return options?.forceRefresh === true || cachedAccounts.length === 0;
  }

  private initializeAccountsWithEmptyBalances(accounts: Account[]): Account[] {
    return accounts.map((account) => ({
      ...account,
      balance: undefined,
      tokens: [],
    }));
  }

  private createBalanceObservable(account: Account): Observable<AccountUpdate> {
    return from(
      this.hydrateAccountWithBalanceUseCase.execute(account, true),
    ).pipe(
      catchError((error) => {
        this.logger.warn(
          "Failed to fetch balance for account, keeping original",
          {
            accountId: account.id,
            error,
          },
        );
        return of(account);
      }),
      map(
        (updatedAccount): AccountUpdate => ({
          accountId: account.id,
          account: updatedAccount,
        }),
      ),
    );
  }

  private mergeAccountUpdate(
    accounts: Account[],
    update: AccountUpdate,
  ): Account[] {
    const index = accounts.findIndex((a) => a.id === update.accountId);
    if (index !== -1) {
      const updated = [...accounts];
      updated[index] = update.account;
      return updated;
    }
    return accounts;
  }
}
