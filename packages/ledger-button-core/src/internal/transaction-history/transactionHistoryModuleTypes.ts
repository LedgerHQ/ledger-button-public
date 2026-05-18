export const transactionHistoryModuleTypes = {
  TransactionHistoryDataSource: Symbol.for("TransactionHistoryDataSource"),
  FetchTransactionHistoryUseCase: Symbol.for("FetchTransactionHistoryUseCase"),
  HydrateTransactionsWithFiatUseCase: Symbol.for(
    "HydrateTransactionsWithFiatUseCase",
  ),
} as const;
