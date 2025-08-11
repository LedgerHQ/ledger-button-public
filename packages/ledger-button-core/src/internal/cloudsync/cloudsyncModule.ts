import { ContainerModule } from "inversify";

import { ContainerOptions } from "../diTypes.js";
import { cloudSyncModuleTypes } from "./cloudSyncModuleTypes.js";
import { DefaultCloudSyncService } from "./service/DefaultCloudSyncService.js";

type CloudsyncOptions = Pick<ContainerOptions, "stub">;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function cloudSyncModuleFactory({ stub }: CloudsyncOptions) {
  return new ContainerModule(({ bind }) => {
    bind(cloudSyncModuleTypes.CloudSyncService)
      .to(DefaultCloudSyncService)
      .inSingletonScope();
  });
}
