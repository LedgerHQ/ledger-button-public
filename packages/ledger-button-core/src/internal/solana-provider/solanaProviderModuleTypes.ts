export const solanaProviderModuleTypes = {
  CoreFacade: Symbol.for("SolanaCoreFacade"),
  BlockchainConfig: Symbol.for("SolanaBlockchainConfig"),
  SolanaRemoteDatasource: Symbol.for("SolanaRemoteDatasource"),
  SignSolanaMessageUseCase: Symbol.for("SignSolanaMessageUseCase"),
} as const;
