import { ContainerModule } from "inversify";

import { type ContainerOptions } from "@internal/diTypes.js";

import { DefaultAccountService } from "../service/DefaultAccountService.js";
import { BuildNetworksUseCase } from "../use-case/buildNetworksUseCase.js";
import { FetchAccountsUseCase } from "../use-case/fetchAccountsUseCase.js";
import { FetchAccountsWithBalanceUseCase } from "../use-case/fetchAccountsWithBalanceUseCase.js";
import { FetchAccountsWithFiatUseCase } from "../use-case/fetchAccountsWithFiatUseCase.js";
import { FetchCloudSyncAccountsUseCase } from "../use-case/fetchCloudSyncAccountsUseCase.js";
import { FetchSelectedAccountUseCase } from "../use-case/fetchSelectedAccountUseCase.js";
import { FilterAccountsByFamilyUseCase } from "../use-case/filterAccountsByFamilyUseCase.js";
import { HydrateAccountWithBalanceUseCase } from "../use-case/HydrateAccountWithBalanceUseCase.js";
import { HydrateAccountWithFiatUseCase } from "../use-case/hydrateAccountWithFiatUseCase.js";
import { HydrateAccountWithTxHistoryUseCase } from "../use-case/hydrateAccountWithTxHistoryUseCase.js";
import { ObserveAccountsWithFiatUseCase } from "../use-case/observeAccountsWithFiatUseCase.js";
import { SortAccountsByFiatUseCase } from "../use-case/sortAccountsByFiatUseCase.js";
import { accountModuleTypes } from "./accountModuleTypes.js";

type AccountModuleOptions = Pick<ContainerOptions, "loggerLevel"> & {
  stub?: boolean;
};

export function accountModuleFactory(_args: AccountModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind(accountModuleTypes.AccountService)
      .to(DefaultAccountService)
      .inSingletonScope();

    bind(accountModuleTypes.FetchAccountsUseCase).to(FetchAccountsUseCase);
    bind(accountModuleTypes.FetchAccountsWithBalanceUseCase).to(
      FetchAccountsWithBalanceUseCase,
    );
    bind(accountModuleTypes.FetchCloudSyncAccountsUseCase).to(
      FetchCloudSyncAccountsUseCase,
    );
    bind(accountModuleTypes.FetchSelectedAccountUseCase).to(
      FetchSelectedAccountUseCase,
    );
    bind(accountModuleTypes.HydrateAccountWithTxHistoryUseCase).to(
      HydrateAccountWithTxHistoryUseCase,
    );
    bind(accountModuleTypes.HydrateAccountWithFiatUseCase).to(
      HydrateAccountWithFiatUseCase,
    );
    bind(accountModuleTypes.HydrateAccountWithBalanceUseCase).to(
      HydrateAccountWithBalanceUseCase,
    );
    bind(accountModuleTypes.FetchAccountsWithFiatUseCase).to(
      FetchAccountsWithFiatUseCase,
    );
    bind(accountModuleTypes.FilterAccountsByFamilyUseCase).to(
      FilterAccountsByFamilyUseCase,
    );
    bind(accountModuleTypes.BuildNetworksUseCase)
      .to(BuildNetworksUseCase)
      .inSingletonScope();
    bind(accountModuleTypes.ObserveAccountsWithFiatUseCase)
      .to(ObserveAccountsWithFiatUseCase)
      .inSingletonScope();
    bind(accountModuleTypes.SortAccountsByFiatUseCase).to(
      SortAccountsByFiatUseCase,
    );
  });
}
