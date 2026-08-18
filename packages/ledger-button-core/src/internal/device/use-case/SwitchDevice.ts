import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "@internal/logger/di/loggerModuleTypes";
import { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { deviceModuleTypes } from "../di/deviceModuleTypes";
import {
  ConnectionType,
  type DeviceManagementKitService,
} from "../service/DeviceManagementKitService";

@injectable()
export class SwitchDevice {
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
  ) {
    this.logger = loggerFactory("SwitchDevice UseCase");
  }

  async execute({ type }: { type: ConnectionType }): Promise<void> {
    try {
      this.logger.info("Switching device", { type });
      await this.deviceManagementKitService.disconnectFromDevice();
      await this.deviceManagementKitService.connectToDevice({ type });
    } catch (error) {
      this.logger.error(`Failed to switch device`, { error });
      throw error;
    }
  }
}
