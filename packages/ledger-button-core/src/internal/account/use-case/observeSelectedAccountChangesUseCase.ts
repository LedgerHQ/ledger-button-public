import { type Factory, inject, injectable } from "inversify";
import {
  distinctUntilChanged,
  from,
  map,
  Observable,
  of,
  switchMap,
} from "rxjs";

import { contextModuleTypes } from "../../context/contextModuleTypes.js";
import { type ContextService } from "../../context/ContextService.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { accountModuleTypes } from "../accountModuleTypes.js";
import type { DetailedAccount } from "../service/AccountService.js";
import { FetchSelectedAccountUseCase } from "./fetchSelectedAccountUseCase.js";

@injectable()
export class ObserveSelectedAccountChangesUseCase {
  private readonly logger: LoggerPublisher;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(accountModuleTypes.FetchSelectedAccountUseCase)
    private readonly fetchSelectedAccountUseCase: FetchSelectedAccountUseCase,
  ) {
    this.logger = loggerFactory("ObserveSelectedAccountChangesUseCase");
  }

  execute(): Observable<DetailedAccount | undefined> {
    return this.contextService.observeContext().pipe(
      distinctUntilChanged(
        (a, b) =>
          a.selectedAccount?.freshAddress === b.selectedAccount?.freshAddress &&
          a.selectedAccount?.currencyId === b.selectedAccount?.currencyId &&
          a.preferredFiatCurrency === b.preferredFiatCurrency,
      ),
      switchMap((ctx) => {
        if (!ctx.selectedAccount) return of(undefined);
        this.logger.debug(
          "Selected account or currency changed, fetching details",
        );
        return from(this.fetchSelectedAccountUseCase.execute()).pipe(
          map((result) =>
            result.isRight() ? result.unsafeCoerce() : undefined,
          ),
        );
      }),
    );
  }
}
