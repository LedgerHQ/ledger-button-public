export const evmProviderModuleTypes = {
  SignTransactionUseCase: Symbol.for("SignTransactionUseCase"),
  SignRawTransactionUseCase: Symbol.for("SignRawTransactionUseCase"),
  SignTypedDataUseCase: Symbol.for("SignTypedDataUseCase"),
  SignPersonalMessageUseCase: Symbol.for("SignPersonalMessageUseCase"),
  BroadcastTransactionUseCase: Symbol.for("BroadcastTransactionUseCase"),
  BuildContextModuleUseCase: Symbol.for("BuildContextModuleUseCase"),
  BuildEthSignerUseCase: Symbol.for("BuildEthSignerUseCase"),
  GasFeeEstimationService: Symbol.for("GasFeeEstimationService"),
  EvmBlockchainProviderFactory: Symbol.for("EvmBlockchainProviderFactory"),
} as const;
