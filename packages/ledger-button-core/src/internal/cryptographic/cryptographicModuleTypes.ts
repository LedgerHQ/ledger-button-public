export const cryptographicModuleTypes = {
  GenerateKeypairUseCase: Symbol.for("GenerateKeypairUseCase"),
  EncryptKeypairUseCase: Symbol.for("EncryptKeypairUseCase"),
  GetEncryptionKeyUseCase: Symbol.for("GetEncryptionKeyUseCase"),
  GetKeypairUseCase: Symbol.for("GetKeypairUseCase"),
  DecryptKeypairUseCase: Symbol.for("DecryptKeypairUseCase"),
} as const;
