import { ContainerModule } from "inversify";

import { type ContainerOptions } from "@internal/diTypes";

import { DefaultAccountService } from "../service/DefaultAccountService";
import { BuildNetworksUseCase } from "../use-case/buildNetworksUseCase";
import { FetchAccountsUseCase } from "../use-case/fetchAccountsUseCase";
import { FetchAccountsWithBalanceUseCase } from "../use-case/fetchAccountsWithBalanceUseCase";
import { FetchAccountsWithFiatUseCase } from "../use-case/fetchAccountsWithFiatUseCase";
import { FetchCloudSyncAccountsUseCase } from "../use-case/fetchCloudSyncAccountsUseCase";
import { FetchSelectedAccountUseCase } from "../use-case/fetchSelectedAccountUseCase";
import { FilterAccountsByFamilyUseCase } from "../use-case/filterAccountsByFamilyUseCase";
import { FindAccountForNetworkUseCase } from "../use-case/findAccountForNetworkUseCase";
import { HydrateAccountWithBalanceUseCase } from "../use-case/HydrateAccountWithBalanceUseCase";
import { HydrateAccountWithFiatUseCase } from "../use-case/hydrateAccountWithFiatUseCase";
import { HydrateAccountWithTxHistoryUseCase } from "../use-case/hydrateAccountWithTxHistoryUseCase";
import { ObserveAccountGroupsUseCase } from "../use-case/observeAccountGroupsUseCase";
import { ObserveAccountsWithFiatUseCase } from "../use-case/observeAccountsWithFiatUseCase";
import { ObserveNetworksForSelectedAddressUseCase } from "../use-case/observeNetworksForSelectedAddressUseCase";
import { SortAccountsByFiatUseCase } from "../use-case/sortAccountsByFiatUseCase";
import { accountModuleTypes } from "./accountModuleTypes";

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
    bind(accountModuleTypes.FindAccountForNetworkUseCase).to(
      FindAccountForNetworkUseCase,
    );
    bind(accountModuleTypes.BuildNetworksUseCase)
      .to(BuildNetworksUseCase)
      .inSingletonScope();
    bind(accountModuleTypes.ObserveAccountGroupsUseCase)
      .to(ObserveAccountGroupsUseCase)
      .inSingletonScope();
    bind(accountModuleTypes.ObserveAccountsWithFiatUseCase)
      .to(ObserveAccountsWithFiatUseCase)
      .inSingletonScope();
    bind(accountModuleTypes.ObserveNetworksForSelectedAddressUseCase).to(
      ObserveNetworksForSelectedAddressUseCase,
    );
    bind(accountModuleTypes.SortAccountsByFiatUseCase).to(
      SortAccountsByFiatUseCase,
    );
  });
}
