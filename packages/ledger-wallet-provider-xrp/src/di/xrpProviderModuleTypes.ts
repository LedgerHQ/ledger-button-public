export const xrpProviderModuleTypes = {
  CoreFacade: Symbol.for("XrpCoreFacade"),
  BlockchainConfig: Symbol.for("XrpBlockchainConfig"),
  SignTransactionUseCase: Symbol.for("XrpSignTransactionUseCase"),
} as const;
