import { inject, injectable } from "inversify";
import {
  debounce,
  distinctUntilChanged,
  map,
  Observable,
  of,
  switchMap,
  timer,
} from "rxjs";

import type { Network } from "@api/model/Account";
import { getActiveSelectedAccount } from "@api/model/ButtonCoreContext";
import type { ContextService } from "@internal/context/ContextService";
import { contextModuleTypes } from "@internal/context/di/contextModuleTypes";

import { accountModuleTypes } from "../di/accountModuleTypes";
import { BuildNetworksUseCase } from "./buildNetworksUseCase";
import { ObserveAccountsWithFiatUseCase } from "./observeAccountsWithFiatUseCase";

const EMISSION_DEBOUNCE_MS = 200;

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
          debounce(this.debounceAfterFirstEmission()),
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

  private debounceAfterFirstEmission(): () => Observable<number> {
    let isFirstEmission = true;

    return () => {
      if (isFirstEmission) {
        isFirstEmission = false;
        return of(0);
      }
      return timer(EMISSION_DEBOUNCE_MS);
    };
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
