import { ContainerModule } from "inversify";

import { ContainerOptions } from "../di.js";
import { DefaultStorageService } from "./DefaultStorageService.js";
import { storageModuleTypes } from "./storageModuleTypes.js";

type StorageModuleOptions = Pick<ContainerOptions, "stub">;

export function storageModuleFactory({ stub }: StorageModuleOptions) {
  return new ContainerModule(({ bind, rebindSync }) => {
    bind(storageModuleTypes.StorageService).to(DefaultStorageService);

    if (stub) {
      rebindSync(storageModuleTypes.StorageService).toConstantValue({
        // TODO: Implement stub
      });
    }
  });
}
