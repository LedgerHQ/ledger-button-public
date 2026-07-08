import { type Factory, inject, injectable } from "inversify";
import { Observable, shareReplay, switchMap } from "rxjs";

import { type BlockchainFamily } from "../../../api/blockchain-provider/model/types.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import type { AccountWithFiat } from "../service/AccountService.js";
import { FetchAccountsWithBalanceUseCase } from "./fetchAccountsWithBalanceUseCase.js";
import { FetchAccountsWithFiatUseCase } from "./fetchAccountsWithFiatUseCase.js";
import { FilterAccountsByFamilyUseCase } from "./filterAccountsByFamilyUseCase.js";
import { SortAccountsByFiatUseCase } from "./sortAccountsByFiatUseCase.js";

@injectable()
export class ObserveAccountsWithFiatUseCase {
  private readonly logger: LoggerPublisher;
  private accounts$: Observable<AccountWithFiat[]> | undefined;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(accountModuleTypes.FetchAccountsWithBalanceUseCase)
    private readonly fetchAccountsWithBalanceUseCase: FetchAccountsWithBalanceUseCase,
    @inject(accountModuleTypes.FetchAccountsWithFiatUseCase)
    private readonly fetchAccountsWithFiatUseCase: FetchAccountsWithFiatUseCase,
    @inject(accountModuleTypes.SortAccountsByFiatUseCase)
    private readonly sortAccountsByFiatUseCase: SortAccountsByFiatUseCase,
    @inject(accountModuleTypes.FilterAccountsByFamilyUseCase)
    private readonly filterAccountsByFamilyUseCase: FilterAccountsByFamilyUseCase,
  ) {
    this.logger = loggerFactory("ObserveAccountsWithFiatUseCase");
  }

  execute(options?: {
    forceRefresh?: boolean;
    family?: BlockchainFamily;
  }): Observable<AccountWithFiat[]> {
    if (options?.forceRefresh || !this.accounts$) {
      this.logger.debug("Building account stream", {
        forceRefresh: options?.forceRefresh,
      });
      this.accounts$ = this.buildPipeline(options).pipe(shareReplay(1));
    }

    return this.filterAccountsByFamilyUseCase.execute(
      this.accounts$,
      options?.family,
    );
  }

  private buildPipeline(options?: {
    forceRefresh?: boolean;
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
