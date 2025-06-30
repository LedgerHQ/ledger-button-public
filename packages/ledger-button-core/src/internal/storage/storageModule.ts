import { ContainerModule } from "inversify";

import { ContainerOptions } from "../diTypes.js";
import { DefaultStorageService } from "./DefaultStorageService.js";
import { storageModuleTypes } from "./storageModuleTypes.js";

type StorageModuleOptions = Pick<ContainerOptions, "stub">;

export function storageModuleFactory({ stub }: StorageModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind(storageModuleTypes.StorageService)
      .to(DefaultStorageService)
      .inSingletonScope();

    if (stub) {
      // rebindSync(storageModuleTypes.StorageService).toConstantValue({
      //   // TODO: Implement stub
      // });
    }
  });
}
