import { ContainerModule } from "inversify";

import { DeviceManagementKitService } from "./service/DeviceManagementKitService.js";
import { ConnectDevice } from "./use-case/ConnectDevice.js";
import { DisconnectDevice } from "./use-case/DisconnectDevice.js";
import { SwitchDevice } from "./use-case/SwitchDevice.js";
import { ContainerOptions } from "../diTypes.js";
import { deviceModuleTypes } from "./deviceModuleTypes.js";

type DeviceModuleOptions = Pick<ContainerOptions, "stub" | "dmkConfig">;

export function deviceModuleFactory({ stub, dmkConfig }: DeviceModuleOptions) {
  return new ContainerModule(({ bind }) => {
    bind(deviceModuleTypes.DmkConfig).toConstantValue(dmkConfig);

    bind(deviceModuleTypes.DeviceManagementKitService)
      .to(DeviceManagementKitService)
      .inSingletonScope();

    bind(deviceModuleTypes.ConnectDeviceUseCase).to(ConnectDevice);
    bind(deviceModuleTypes.DisconnectDeviceUseCase).to(DisconnectDevice);
    bind(deviceModuleTypes.SwitchDeviceUseCase).to(SwitchDevice);

    if (stub) {
      // rebindSync(deviceModuleTypes.DeviceManagementKit).toConstantValue({
      //   // TODO: Implement stub
      // });
    }
  });
}
