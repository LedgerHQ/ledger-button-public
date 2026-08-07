import { type Factory, inject, injectable } from "inversify";
import { Observable, shareReplay, switchMap } from "rxjs";

import { type BlockchainFamily } from "../../../api/blockchain-provider/model/types.js";
import { loggerModuleTypes } from "../../logger/di/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../di/accountModuleTypes.js";
import type { AccountWithFiat } from "../service/AccountService.js";
import { FetchAccountsWithBalanceUseCase } from "./fetchAccountsWithBalanceUseCase.js";
import { FetchAccountsWithFiatUseCase } from "./fetchAccountsWithFiatUseCase.js";
import { SortAccountsByFiatUseCase } from "./sortAccountsByFiatUseCase.js";

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
