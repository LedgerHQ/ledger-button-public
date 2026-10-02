import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { deviceModuleTypes } from "../di/deviceModuleTypes";
import { type DeviceManagementKitService } from "../service/DeviceManagementKitService";

@injectable()
export class DisconnectDevice {
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
  ) {
    this.logger = loggerFactory("DisconnectDevice UseCase");
  }

  async execute(): Promise<void> {
    this.logger.info("Disconnecting from device");
    return this.deviceManagementKitService.disconnectFromDevice();
  }
}
