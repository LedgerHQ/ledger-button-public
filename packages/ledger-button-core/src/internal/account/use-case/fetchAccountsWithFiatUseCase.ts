import { type Factory, inject, injectable } from "inversify";
import {
  catchError,
  distinctUntilChanged,
  from,
  map,
  merge,
  Observable,
  of,
  scan,
  startWith,
  switchMap,
} from "rxjs";

import type { Account, AccountWithFiat } from "@api/model/Account";
import { type ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { enrichWithLoadingStates } from "../accountFiatUtils";
import { accountModuleTypes } from "../di/accountModuleTypes";
import type { AccountUpdate } from "../service/AccountService";
import { HydrateAccountWithFiatUseCase } from "./hydrateAccountWithFiatUseCase";

@injectable()
export class FetchAccountsWithFiatUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(accountModuleTypes.HydrateAccountWithFiatUseCase)
    private readonly hydrateAccountWithFiatUseCase: HydrateAccountWithFiatUseCase,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
  ) {
    this.logger = loggerFactory("FetchAccountsWithFiatUseCase");
  }

  execute(accounts: Account[]): Observable<AccountWithFiat[]> {
    if (accounts.length === 0) {
      return of([]);
    }

    return this.contextService.observeContext().pipe(
      map((context) => context.preferredFiatCurrency),
      distinctUntilChanged(),
      switchMap(() => this.hydrateAccounts(accounts)),
    );
  }

  private hydrateAccounts(
    accounts: Account[],
  ): Observable<AccountWithFiat[]> {
    const initialAccounts = this.initializeAccountsWithoutFiat(accounts);

    const fiatObservables = initialAccounts.map((account) =>
      this.createFiatObservable(account),
    );

    return merge(...fiatObservables).pipe(
      scan(
        (acc: AccountWithFiat[], update: AccountUpdate) =>
          this.mergeAccountUpdate(acc, update),
        initialAccounts,
      ),
      startWith(initialAccounts),
    );
  }

  private initializeAccountsWithoutFiat(
    accounts: Account[],
  ): AccountWithFiat[] {
    return accounts.map((account) =>
      enrichWithLoadingStates({
        ...account,
        fiatBalance: undefined,
        fiatError: false,
      }),
    );
  }

  private createFiatObservable(account: Account): Observable<AccountUpdate> {
    return from(this.hydrateAccountWithFiatUseCase.execute(account)).pipe(
      catchError((error) => {
        this.logger.warn(
          "Failed to fetch fiat value for account, keeping original",
          {
            accountId: account.id,
            error,
          },
        );
        return of(
          enrichWithLoadingStates({
            ...account,
            fiatBalance: undefined,
            fiatError: true,
          }),
        );
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
    accounts: AccountWithFiat[],
    update: AccountUpdate,
  ): AccountWithFiat[] {
    const index = accounts.findIndex((a) => a.id === update.accountId);
    if (index !== -1) {
      const updated = [...accounts];
      updated[index] = enrichWithLoadingStates(
        update.account as AccountWithFiat,
      );
      return updated;
    }
    return accounts;
  }
}
