export const accountModuleTypes = {
  AccountService: Symbol.for("AccountService"),
  LocalAccountDataSource: Symbol.for("LocalAccountDataSource"),
  RemoteAccountDataSource: Symbol.for("RemoteAccountDataSource"),
} as const;
