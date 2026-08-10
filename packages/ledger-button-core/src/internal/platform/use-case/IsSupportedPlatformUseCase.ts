import { inject, injectable } from "inversify";

import { deviceModuleTypes } from "../../device/di/deviceModuleTypes.js";
import { type DeviceManagementKitService } from "../../device/service/DeviceManagementKitService.js";
import { platformModuleTypes } from "../di/platformModuleTypes.js";
import { type IsMobileUseCase } from "./IsMobileUseCase.js";

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
