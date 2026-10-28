import { ContainerModule } from "inversify";

import { ContainerOptions, MockServerConfig } from "@internal/diTypes";

import { DefaultDeviceManagementKitService } from "../service/DefaultDeviceManagementKitService";
import { StubDeviceManagementKitService } from "../service/StubDeviceManagementKitService";
import { ConnectDevice } from "../use-case/ConnectDevice";
import { DisconnectDevice } from "../use-case/DisconnectDevice";
import { ListAvailableDevices } from "../use-case/ListAvailableDevices";
import { SwitchDevice } from "../use-case/SwitchDevice";
import { deviceModuleTypes } from "./deviceModuleTypes";

type DeviceModuleOptions = Pick<
  ContainerOptions,
  "dmkConfig" | "dmkLogLevel"
> & {
  stub?: boolean;
  mockServerConfig?: MockServerConfig;
};

export function deviceModuleFactory({
  stub,
  dmkConfig,
  dmkLogLevel = "error",
  mockServerConfig,
}: DeviceModuleOptions) {
  return new ContainerModule(({ bind, rebindSync }) => {
    bind(deviceModuleTypes.DmkConfig).toConstantValue(dmkConfig);
    bind(deviceModuleTypes.DmkLogLevel).toConstantValue(dmkLogLevel);
    bind(deviceModuleTypes.DmkMockServerConfig).toConstantValue(
      mockServerConfig,
    );

    bind(deviceModuleTypes.DeviceManagementKitService)
      .to(DefaultDeviceManagementKitService)
      .inSingletonScope();

    bind(deviceModuleTypes.ConnectDeviceUseCase).to(ConnectDevice);
    bind(deviceModuleTypes.DisconnectDeviceUseCase).to(DisconnectDevice);
    bind(deviceModuleTypes.SwitchDeviceUseCase).to(SwitchDevice);
    bind(deviceModuleTypes.ListAvailableDevicesUseCase).to(
      ListAvailableDevices,
    );

    if (stub) {
      rebindSync(deviceModuleTypes.DeviceManagementKitService).to(
        StubDeviceManagementKitService,
      );
    }
  });
}
