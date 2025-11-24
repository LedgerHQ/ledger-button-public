export const storageModuleTypes = {
  StorageService: Symbol.for("StorageService"),
  MigrateDbUseCase: Symbol.for("MigrateDbUseCase"),
  KeyPairMigrationService: Symbol.for("KeyPairMigrationService"),
} as const;
