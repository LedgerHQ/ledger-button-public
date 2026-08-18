import { ContainerModule } from "inversify";

import { DefaultCloudSyncService } from "../service/DefaultCloudSyncService";
import { cloudSyncModuleTypes } from "./cloudSyncModuleTypes";

type CloudsyncOptions = {
  stub?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function cloudSyncModuleFactory({ stub }: CloudsyncOptions) {
  return new ContainerModule(({ bind }) => {
    bind(cloudSyncModuleTypes.CloudSyncService)
      .to(DefaultCloudSyncService)
      .inSingletonScope();
  });
}
