import { type DeviceSessionId } from "@ledgerhq/device-management-kit";
import { type Factory, inject, injectable } from "inversify";

import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import { DeviceConnectionError } from "../model/errors.js";
import { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";

@injectable()
export class ConnectDevice {
  private readonly logger: LoggerPublisher;
  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
  ) {
    this.logger = loggerFactory("ConnectDevice UseCase");
  }

  async execute({ type }: { type: "hid" | "ble" }): Promise<DeviceSessionId> {
    return this.deviceManagementKitService
      .connectToDevice({ type })
      .catch((error) => {
        this.logger.error(`Failed to connect to device`, { error });
        throw new DeviceConnectionError(`Failed to connect to device`, {
          error,
        });
      });
  }
}
