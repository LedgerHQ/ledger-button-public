export const accountModuleTypes = {
  AccountService: Symbol.for("AccountService"),
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
  ObserveAccountsWithFiatUseCase: Symbol.for("ObserveAccountsWithFiatUseCase"),
  ObserveSelectedAccountChangesUseCase: Symbol.for(
    "ObserveSelectedAccountChangesUseCase",
  ),
  SortAccountsByFiatUseCase: Symbol.for("SortAccountsByFiatUseCase"),
} as const;
