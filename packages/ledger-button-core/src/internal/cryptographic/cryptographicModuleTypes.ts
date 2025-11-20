export const cryptographicModuleTypes = {
  GenerateKeypairUseCase: Symbol.for("GenerateKeypairUseCase"),
  EncryptKeypairUseCase: Symbol.for("EncryptKeypairUseCase"),
  GetEncryptionKeyUseCase: Symbol.for("GetEncryptionKeyUseCase"),
  GetOrCreateKeyPairUseCase: Symbol.for("GetOrCreateKeyPairUseCase"),
  DecryptKeypairUseCase: Symbol.for("DecryptKeypairUseCase"),
} as const;
