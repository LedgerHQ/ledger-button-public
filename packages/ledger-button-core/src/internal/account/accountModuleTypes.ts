export const accountModuleTypes = {
  AccountService: Symbol.for("AccountService"),
  FetchAccountsUseCase: Symbol.for("FetchAccountsUseCase"),
  FetchAccountsWithBalanceUseCase: Symbol.for(
    "FetchAccountsWithBalanceUseCase",
  ),
  FetchSelectedAccountUseCase: Symbol.for("FetchSelectedAccountUseCase"),
} as const;
