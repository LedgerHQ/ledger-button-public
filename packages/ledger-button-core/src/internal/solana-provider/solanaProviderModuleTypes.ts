export const solanaProviderModuleTypes = {
  SolanaRemoteDatasource: Symbol.for("SolanaRemoteDatasource"),
  SolanaRPCCallUseCase: Symbol.for("SolanaRPCCallUseCase"),
  SignSolanaMessageUseCase: Symbol.for("SignSolanaMessageUseCase"),
  SignSolanaTransactionUseCase: Symbol.for("SignSolanaTransactionUseCase"),
  SendSolanaTransactionUseCase: Symbol.for("SendSolanaTransactionUseCase"),
} as const;
