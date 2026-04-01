 import { inject, injectable } from "inversify";

import { deviceModuleTypes } from "../../device/deviceModuleTypes.js";
import { type DeviceManagementKitService } from "../../device/service/DeviceManagementKitService.js";
import { mobileModuleTypes } from "../mobileModuleTypes.js";
import { type IsMobileUseCase } from "./IsMobile.js";

@injectable()
export class IsSupportedUseCase {
  constructor(
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
    @inject(mobileModuleTypes.IsMobileUseCase)
    private readonly isMobile: IsMobileUseCase,
  ) {}

  execute(): boolean {
    return (
      this.isMobile.execute() ||
      this.deviceManagementKitService.dmk.isEnvironmentSupported()
    );
  }
}
