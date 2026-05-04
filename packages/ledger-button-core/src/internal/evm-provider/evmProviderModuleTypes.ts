export const evmProviderModuleTypes = {
  LedgerRemoteDatasource: Symbol.for("LedgerRemoteDatasource"),
  JSONRPCCallUseCase: Symbol.for("JSONRPCCallUseCase"),
  SignTransactionUseCase: Symbol.for("SignTransactionUseCase"),
  SignRawTransactionUseCase: Symbol.for("SignRawTransactionUseCase"),
  SignTypedDataUseCase: Symbol.for("SignTypedDataUseCase"),
  SignPersonalMessageUseCase: Symbol.for("SignPersonalMessageUseCase"),
  BroadcastTransactionUseCase: Symbol.for("BroadcastTransactionUseCase"),
  GasFeeEstimationService: Symbol.for("GasFeeEstimationService"),
} as const;
