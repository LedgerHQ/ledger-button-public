import { ContainerModule } from "inversify";

import { MigrateDbUseCase } from "./usecases/MigrateDbUseCase.js";
import { DefaultStorageService } from "./DefaultStorageService.js";
import { storageModuleTypes } from "./storageModuleTypes.js";

type StorageModuleOptions = {
  stub?: boolean;
};

export function storageModuleFactory({ stub }: StorageModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind(storageModuleTypes.StorageService)
      .to(DefaultStorageService)
      .inSingletonScope();

    bind(storageModuleTypes.MigrateDbUseCase)
      .to(MigrateDbUseCase)
      .inSingletonScope();

    if (stub) {
      // rebindSync(storageModuleTypes.StorageService).toConstantValue({
      //   // TODO: Implement stub
      // });
    }
  });
}
