export const cryptographicModuleTypes = {
  GenerateKeyPairUseCase: Symbol.for("GenerateKeyPairUseCase"),
  EncryptKeyPairUseCase: Symbol.for("EncryptKeyPairUseCase"),
  GetEncryptionKeyUseCase: Symbol.for("GetEncryptionKeyUseCase"),
  GetKeyPairUseCase: Symbol.for("GetKeyPairUseCase"),
  DecryptKeyPairUseCase: Symbol.for("DecryptKeyPairUseCase"),
} as const;
