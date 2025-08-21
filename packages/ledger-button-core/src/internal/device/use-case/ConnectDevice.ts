import { type DeviceSessionId } from "@ledgerhq/device-management-kit";
import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import {
  ConnectionType,
  type DeviceManagementKitService,
} from "../service/DeviceManagementKitService.js";
import { Device } from "../model/Device.js";

@injectable()
export class ConnectDevice {
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
  ) {
    this.logger = loggerFactory("[ConnectDevice UseCase]");
  }

  async execute({ type }: { type: ConnectionType }): Promise<Device> {
    this.logger.info("Connecting to device", { type });
    return this.deviceManagementKitService.connectToDevice({
      type,
    });
  }
}
