import { ContainerModule } from "inversify";

import { ContainerOptions, MockServerConfig } from "@internal/di/diTypes";

import { DefaultDeviceManagementKitService } from "../service/DefaultDeviceManagementKitService";
import { StubDeviceManagementKitService } from "../service/StubDeviceManagementKitService";
import { ConnectDeviceUseCase } from "../use-case/ConnectDeviceUseCase";
import { DisconnectDeviceUseCase } from "../use-case/DisconnectDeviceUseCase";
import { ListAvailableDevicesUseCase } from "../use-case/ListAvailableDevicesUseCase";
import { SwitchDeviceUseCase } from "../use-case/SwitchDeviceUseCase";
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

    bind(deviceModuleTypes.ConnectDeviceUseCase).to(ConnectDeviceUseCase);
    bind(deviceModuleTypes.DisconnectDeviceUseCase).to(DisconnectDeviceUseCase);
    bind(deviceModuleTypes.SwitchDeviceUseCase).to(SwitchDeviceUseCase);
    bind(deviceModuleTypes.ListAvailableDevicesUseCase).to(
      ListAvailableDevicesUseCase,
    );

    if (stub) {
      rebindSync(deviceModuleTypes.DeviceManagementKitService).to(
        StubDeviceManagementKitService,
      );
    }
  });
}
