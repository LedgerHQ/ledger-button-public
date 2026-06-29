export const evmProviderModuleTypes = {
  /** The host CoreFacade, bound per-instance in the EVM local container. */
  CoreFacade: Symbol.for("EvmCoreFacade"),
  /** The per-provider BlockchainConfig, bound per-instance in the container. */
  BlockchainConfig: Symbol.for("EvmBlockchainConfig"),
  SignTransactionUseCase: Symbol.for("SignTransactionUseCase"),
  SignRawTransactionUseCase: Symbol.for("SignRawTransactionUseCase"),
  SignTypedDataUseCase: Symbol.for("SignTypedDataUseCase"),
  SignPersonalMessageUseCase: Symbol.for("SignPersonalMessageUseCase"),
  BroadcastTransactionUseCase: Symbol.for("BroadcastTransactionUseCase"),
  BuildContextModuleUseCase: Symbol.for("BuildContextModuleUseCase"),
  BuildEthSignerUseCase: Symbol.for("BuildEthSignerUseCase"),
  GasFeeEstimationService: Symbol.for("GasFeeEstimationService"),
} as const;
