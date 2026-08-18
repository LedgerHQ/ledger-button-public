import { type Factory, inject, injectable } from "inversify";
import { Observable, shareReplay, switchMap } from "rxjs";

import { type BlockchainFamily } from "@api/blockchain-provider/model/types";
import type { AccountWithFiat } from "@api/model/Account";
import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { type LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { accountModuleTypes } from "../di/accountModuleTypes";
import { FetchAccountsWithBalanceUseCase } from "./fetchAccountsWithBalanceUseCase";
import { FetchAccountsWithFiatUseCase } from "./fetchAccountsWithFiatUseCase";
import { SortAccountsByFiatUseCase } from "./sortAccountsByFiatUseCase";

@injectable()
export class ObserveAccountsWithFiatUseCase {
  private static readonly ALL_FAMILIES_KEY = "__all__";

  private readonly logger: LoggerPublisher;
  private readonly streamsByFamily = new Map<
    string,
    Observable<AccountWithFiat[]>
  >();

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(accountModuleTypes.FetchAccountsWithBalanceUseCase)
    private readonly fetchAccountsWithBalanceUseCase: FetchAccountsWithBalanceUseCase,
    @inject(accountModuleTypes.FetchAccountsWithFiatUseCase)
    private readonly fetchAccountsWithFiatUseCase: FetchAccountsWithFiatUseCase,
    @inject(accountModuleTypes.SortAccountsByFiatUseCase)
    private readonly sortAccountsByFiatUseCase: SortAccountsByFiatUseCase,
  ) {
    this.logger = loggerFactory("ObserveAccountsWithFiatUseCase");
  }

  execute(options?: {
    forceRefresh?: boolean;
    family?: BlockchainFamily;
  }): Observable<AccountWithFiat[]> {
    if (options?.forceRefresh) {
      this.streamsByFamily.clear();
    }

    const key = this.cacheKey(options?.family);
    const cached = this.streamsByFamily.get(key);
    if (cached) {
      return cached;
    }

    this.logger.debug("Building account stream", {
      forceRefresh: options?.forceRefresh,
      family: options?.family,
    });
    const stream = this.buildPipeline(options).pipe(shareReplay(1));
    this.streamsByFamily.set(key, stream);
    return stream;
  }

  private cacheKey(family?: BlockchainFamily): string {
    return family ?? ObserveAccountsWithFiatUseCase.ALL_FAMILIES_KEY;
  }

  private buildPipeline(options?: {
    forceRefresh?: boolean;
    family?: BlockchainFamily;
  }): Observable<AccountWithFiat[]> {
    return this.sortAccountsByFiatUseCase.execute(
      this.fetchAccountsWithBalanceUseCase
        .execute(options)
        .pipe(
          switchMap((accounts) =>
            this.fetchAccountsWithFiatUseCase.execute(accounts),
          ),
        ),
    );
  }
}
