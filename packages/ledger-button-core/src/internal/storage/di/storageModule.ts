import { ContainerModule } from "inversify";

import { DefaultStorageService } from "../DefaultStorageService";
import { DefaultIndexedDbService } from "../service/DefaultIndexedDbService";
import { KeyPairMigrationService } from "../use-case/KeypairMigrationService";
import { MigrateDbUseCase } from "../use-case/MigrateDbUseCase";
import { storageModuleTypes } from "./storageModuleTypes";

type StorageModuleOptions = {
  stub?: boolean;
};

export function storageModuleFactory({ stub }: StorageModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind(storageModuleTypes.StorageService)
      .to(DefaultStorageService)
      .inSingletonScope();

    bind(storageModuleTypes.IndexedDbService)
      .to(DefaultIndexedDbService)
      .inSingletonScope();

    bind(storageModuleTypes.MigrateDbUseCase)
      .to(MigrateDbUseCase)
      .inSingletonScope();

    bind(storageModuleTypes.KeyPairMigrationService)
      .to(KeyPairMigrationService)
      .inSingletonScope();

    if (stub) {
      // rebindSync(storageModuleTypes.StorageService).toConstantValue({
      //   // TODO: Implement stub
      // });
    }
  });
}
