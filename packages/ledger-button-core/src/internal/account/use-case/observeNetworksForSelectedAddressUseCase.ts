import { inject, injectable } from "inversify";
import {
  distinctUntilChanged,
  map,
  Observable,
  of,
  switchMap,
} from "rxjs";

import type { Network } from "@api/model/Account.js";
import { getActiveSelectedAccount } from "@api/model/ButtonCoreContext.js";
import type { ContextService } from "@internal/context/ContextService.js";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes.js";

import { accountModuleTypes } from "../di/accountModuleTypes.js";
import { BuildNetworksUseCase } from "./buildNetworksUseCase.js";
import { ObserveAccountsWithFiatUseCase } from "./observeAccountsWithFiatUseCase.js";

/**
 * Networks available for the address of the currently selected account: every
 * account sharing that address, enriched and sorted by fiat value.
 */
@injectable()
export class ObserveNetworksForSelectedAddressUseCase {
  constructor(
    @inject(contextModuleTypes.ContextService)
    private readonly contextService: ContextService,
    @inject(accountModuleTypes.ObserveAccountsWithFiatUseCase)
    private readonly observeAccountsWithFiatUseCase: ObserveAccountsWithFiatUseCase,
    @inject(accountModuleTypes.BuildNetworksUseCase)
    private readonly buildNetworksUseCase: BuildNetworksUseCase,
  ) {}

  execute(): Observable<Network[]> {
    return this.observeSelectedAddress().pipe(
      switchMap((address) => {
        if (!address) {
          return of<Network[]>([]);
        }

        return this.observeAccountsWithFiatUseCase.execute().pipe(
          map((accounts) =>
            accounts.filter((account) => account.freshAddress === address),
          ),
          switchMap((accounts) =>
            accounts.length
              ? this.buildNetworksUseCase.execute(accounts)
              : of<Network[]>([]),
          ),
        );
      }),
    );
  }

  private observeSelectedAddress(): Observable<string | undefined> {
    return this.contextService
      .observeContext()
      .pipe(
        map((context) => getActiveSelectedAccount(context)?.freshAddress),
        distinctUntilChanged(),
      );
  }
}
