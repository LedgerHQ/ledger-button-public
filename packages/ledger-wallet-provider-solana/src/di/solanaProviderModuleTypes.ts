export const solanaProviderModuleTypes = {
  CoreFacade: Symbol.for("SolanaCoreFacade"),
  BlockchainConfig: Symbol.for("SolanaBlockchainConfig"),
  SignSolanaMessageUseCase: Symbol.for("SignSolanaMessageUseCase"),
  SignTransactionUseCase: Symbol.for("SolanaSignTransactionUseCase"),
  BuildContextModuleUseCase: Symbol.for("SolanaBuildContextModuleUseCase"),
} as const;
