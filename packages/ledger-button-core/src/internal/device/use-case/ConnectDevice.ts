import {
  DeviceModelId,
  GetOsVersionCommand,
  isSuccessCommandResult,
} from "@ledgerhq/device-management-kit";
import { type Factory, inject, injectable } from "inversify";

import {
  DeviceNotOnboardedError,
  DeviceNotSupportedError,
} from "../../../api/errors/DeviceErrors.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import { Device } from "../model/Device.js";
import {
  ConnectionType,
  type DeviceManagementKitService,
} from "../service/DeviceManagementKitService.js";

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

  async execute({ type }: { type: ConnectionType }): Promise<Device> {
    this.logger.info("Connecting to device", { type });
    const device = await this.deviceManagementKitService.connectToDevice({
      type,
    });

    console.log("device", JSON.stringify(device, null, 2));
    await this.rejectUnsupportedDevice(device);
    await this.assertDeviceOnboarded(device);

    return device;
  }

  private async rejectUnsupportedDevice(device: Device): Promise<void> {
    if (device.modelId !== DeviceModelId.NANO_S) {
      return;
    }

    await this.deviceManagementKitService.disconnectFromDevice();
    const error = new DeviceNotSupportedError("Device not supported", {
      modelId: device.modelId,
    });
    this.logger.error("Device not supported", { error });
    throw error;
  }

  private async assertDeviceOnboarded(device: Device): Promise<void> {
    const osVersionResult = await this.getOsVersionResult(device);

    console.log("osVersionResult", JSON.stringify(osVersionResult, null, 2));
    if (
      isSuccessCommandResult(osVersionResult) &&
      !osVersionResult.data.secureElementFlags.isOnboarded
    ) {
      await this.deviceManagementKitService.disconnectFromDevice();
      const error = new DeviceNotOnboardedError("Device not onboarded");
      this.logger.error("Device not onboarded", { error });
      throw error;
    }

    if (!isSuccessCommandResult(osVersionResult)) {
      this.logger.warn("Failed to get OS version after connect", {
        error: osVersionResult.error,
      });
    }
  }

  private getOsVersionResult(device: Device) {
    return this.deviceManagementKitService.dmk.sendCommand({
      sessionId: device.sessionId,
      command: new GetOsVersionCommand(),
    });
  }
}
