import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { deviceModuleTypes } from "../di/deviceModuleTypes";
import { type DeviceManagementKitService } from "../service/DeviceManagementKitService";

@injectable()
export class ListAvailableDevices {
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
  ) {
    this.logger = loggerFactory("ListAvailableDevices UseCase");
  }

  async execute(): Promise<DiscoveredDevice[]> {
    this.logger.info("Listing available devices");
    return this.deviceManagementKitService.listAvailableDevices();
  }
}
