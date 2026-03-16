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
} from "rxjs";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { enrichWithLoadingStates } from "../accountFiatUtils.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import type {
  Account,
  AccountUpdate,
  AccountWithFiat,
} from "../service/AccountService.js";
import { HydrateAccountWithFiatUseCase } from "./hydrateAccountWithFiatUseCase.js";

@injectable()
export class FetchAccountsWithFiatUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(accountModuleTypes.HydrateAccountWithFiatUseCase)
    private readonly hydrateAccountWithFiatUseCase: HydrateAccountWithFiatUseCase,
  ) {
    this.logger = loggerFactory("[FetchAccountsWithFiatUseCase]");
  }

  execute(
    accounts: Account[],
    targetCurrency = "usd",
  ): Observable<AccountWithFiat[]> {
    if (accounts.length === 0) {
      return of([]);
    }

    const initialAccounts = this.initializeAccountsWithoutFiat(accounts);

    const fiatObservables = initialAccounts.map((account) =>
      this.createFiatObservable(account, targetCurrency),
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

  private createFiatObservable(
    account: Account,
    targetCurrency: string,
  ): Observable<AccountUpdate> {
    return from(
      this.hydrateAccountWithFiatUseCase.execute(account, targetCurrency),
    ).pipe(
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
