export const accountModuleTypes = {
  AccountService: Symbol.for("AccountService"),
  BuildNetworksUseCase: Symbol.for("BuildNetworksUseCase"),
  FindAccountForNetworkUseCase: Symbol.for("FindAccountForNetworkUseCase"),
  FetchAccountsUseCase: Symbol.for("FetchAccountsUseCase"),
  FetchAccountsWithBalanceUseCase: Symbol.for(
    "FetchAccountsWithBalanceUseCase",
  ),
  FetchCloudSyncAccountsUseCase: Symbol.for("FetchCloudSyncAccountsUseCase"),
  FetchSelectedAccountUseCase: Symbol.for("FetchSelectedAccountUseCase"),
  HydrateAccountWithTxHistoryUseCase: Symbol.for(
    "HydrateAccountWithTxHistoryUseCase",
  ),
  HydrateAccountWithFiatUseCase: Symbol.for("HydrateAccountWithFiatUseCase"),
  HydrateAccountWithBalanceUseCase: Symbol.for(
    "HydrateAccountWithBalanceUseCase",
  ),
  FetchAccountsWithFiatUseCase: Symbol.for("FetchAccountsWithFiatUseCase"),
  FilterAccountsByFamilyUseCase: Symbol.for("FilterAccountsByFamilyUseCase"),
  ObserveAccountGroupsUseCase: Symbol.for("ObserveAccountGroupsUseCase"),
  ObserveAccountsWithFiatUseCase: Symbol.for("ObserveAccountsWithFiatUseCase"),
  ObserveNetworksForSelectedAddressUseCase: Symbol.for(
    "ObserveNetworksForSelectedAddressUseCase",
  ),
  SortAccountsByFiatUseCase: Symbol.for("SortAccountsByFiatUseCase"),
} as const;
