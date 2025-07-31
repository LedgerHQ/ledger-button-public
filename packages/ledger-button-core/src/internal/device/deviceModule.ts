import { ContainerModule } from "inversify";

import { DefaultDeviceManagementKitService } from "./service/DefaultDeviceManagementKitService.js";
import { StubDeviceManagementKitService } from "./service/StubDeviceManagementKitService.js";
import { ConnectDevice } from "./use-case/ConnectDevice.js";
import { DisconnectDevice } from "./use-case/DisconnectDevice.js";
import { SignTransaction } from "./use-case/SignTransaction.js";
import { SwitchDevice } from "./use-case/SwitchDevice.js";
import { ContainerOptions } from "../diTypes.js";
import { deviceModuleTypes } from "./deviceModuleTypes.js";

type DeviceModuleOptions = Pick<ContainerOptions, "stub" | "dmkConfig">;

export function deviceModuleFactory({ stub, dmkConfig }: DeviceModuleOptions) {
  return new ContainerModule(({ bind, rebindSync }) => {
    bind(deviceModuleTypes.DmkConfig).toConstantValue(dmkConfig);

    bind(deviceModuleTypes.DeviceManagementKitService)
      .to(DefaultDeviceManagementKitService)
      .inSingletonScope();

    bind(deviceModuleTypes.ConnectDeviceUseCase).to(ConnectDevice);
    bind(deviceModuleTypes.DisconnectDeviceUseCase).to(DisconnectDevice);
    bind(deviceModuleTypes.SwitchDeviceUseCase).to(SwitchDevice);
    bind(deviceModuleTypes.SignTransactionUseCase).to(SignTransaction);

    if (stub) {
      rebindSync(deviceModuleTypes.DeviceManagementKitService).to(
        StubDeviceManagementKitService,
      );
    }
  });
}
