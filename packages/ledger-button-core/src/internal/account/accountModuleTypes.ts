export const accountModuleTypes = {
  AccountService: Symbol.for("AccountService"),
  FetchAccountsUseCase: Symbol.for("FetchAccountsUseCase"),
  LocalAccountDataSource: Symbol.for("LocalAccountDataSource"),
} as const;
