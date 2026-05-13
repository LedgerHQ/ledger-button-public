export const transactionHistoryModuleTypes = {
  TransactionHistoryDataSource: Symbol.for("TransactionHistoryDataSource"),
  CurrencyMetadataProvider: Symbol.for("CurrencyMetadataProvider"),
  FetchTransactionHistoryUseCase: Symbol.for("FetchTransactionHistoryUseCase"),
  HydrateTransactionsWithFiatUseCase: Symbol.for(
    "HydrateTransactionsWithFiatUseCase",
  ),
} as const;
