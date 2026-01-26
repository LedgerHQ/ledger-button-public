export const accountModuleTypes = {
  AccountService: Symbol.for("AccountService"),
  FetchAccountsUseCase: Symbol.for("FetchAccountsUseCase"),
  FetchAccountsWithBalanceUseCase: Symbol.for(
    "FetchAccountsWithBalanceUseCase",
  ),
  FetchCloudSyncAccountsUseCase: Symbol.for("FetchCloudSyncAccountsUseCase"),
  FetchSelectedAccountUseCase: Symbol.for("FetchSelectedAccountUseCase"),
} as const;
