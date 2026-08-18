import { inject, injectable } from "inversify";

import { deviceModuleTypes } from "@internal/device/di/deviceModuleTypes";
import { type DeviceManagementKitService } from "@internal/device/service/DeviceManagementKitService";

import { platformModuleTypes } from "../di/platformModuleTypes";
import { type IsMobileUseCase } from "./IsMobileUseCase";

@injectable()
export class IsSupportedPlatformUseCase {
  constructor(
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
    @inject(platformModuleTypes.IsMobileUseCase)
    private readonly isMobile: IsMobileUseCase,
  ) {}

  execute(): boolean {
    return (
      this.isMobile.execute() ||
      this.deviceManagementKitService.dmk.isEnvironmentSupported()
    );
  }
}
