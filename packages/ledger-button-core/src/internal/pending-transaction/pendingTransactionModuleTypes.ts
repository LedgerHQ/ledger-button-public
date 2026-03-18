export const pendingTransactionModuleTypes = {
  PendingTransactionController: Symbol.for("PendingTransactionController"),
  PendingTransactionStorageService: Symbol.for(
    "PendingTransactionStorageService",
  ),
  TrackBroadcastedTransactionUseCase: Symbol.for(
    "TrackBroadcastedTransactionUseCase",
  ),
  ConfirmPendingTransactionsUseCase: Symbol.for(
    "ConfirmPendingTransactionsUseCase",
  ),
} as const;
