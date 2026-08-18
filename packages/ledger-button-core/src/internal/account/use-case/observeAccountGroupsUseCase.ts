import { type Factory, inject, injectable } from "inversify";
import {
  combineLatest,
  debounce,
  map,
  Observable,
  of,
  timer,
} from "rxjs";

import { type BlockchainFamily } from "@api/blockchain-provider/model/types.js";
import type { AccountGroup } from "@api/model/Account.js";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes.js";
import { type LoggerPublisher } from "@internal/logger/service/LoggerPublisher.js";

import {
  accountMatchesQuery,
  groupAccountsByAddress,
  toAccountListItem,
} from "../accountFiatUtils.js";
import { accountModuleTypes } from "../di/accountModuleTypes.js";
import { ObserveAccountsWithFiatUseCase } from "./observeAccountsWithFiatUseCase.js";

export type ObserveAccountGroupsOptions = {
  forceRefresh?: boolean;
  family?: BlockchainFamily;
  searchQuery$?: Observable<string>;
};

/**
 * Accounts are hydrated one by one, so the underlying stream emits very
 * frequently. Only the first emission is passed through immediately (so the
 * list appears before balances load); the following ones are throttled.
 */
const EMISSION_THROTTLE_MS = 200;

@injectable()
export class ObserveAccountGroupsUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(accountModuleTypes.ObserveAccountsWithFiatUseCase)
    private readonly observeAccountsWithFiatUseCase: ObserveAccountsWithFiatUseCase,
  ) {
    this.logger = loggerFactory("ObserveAccountGroupsUseCase");
  }

  execute(options?: ObserveAccountGroupsOptions): Observable<AccountGroup[]> {
    this.logger.debug("Building account group stream", {
      forceRefresh: options?.forceRefresh,
      family: options?.family,
    });

    const accounts$ = this.observeAccountsWithFiatUseCase.execute({
      forceRefresh: options?.forceRefresh,
      family: options?.family,
    });

    return combineLatest([
      accounts$.pipe(debounce(this.throttleAfterFirstEmission())),
      options?.searchQuery$ ?? of(""),
    ]).pipe(
      map(([accounts, searchQuery]) =>
        groupAccountsByAddress(
          accounts
            .filter((account) => accountMatchesQuery(account, searchQuery))
            .map(toAccountListItem),
        ),
      ),
    );
  }

  private throttleAfterFirstEmission(): () => Observable<number> {
    let isFirstEmission = true;

    return () => {
      if (isFirstEmission) {
        isFirstEmission = false;
        return of(0);
      }
      return timer(EMISSION_THROTTLE_MS);
    };
  }
}
