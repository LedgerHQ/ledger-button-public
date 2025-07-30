import {
  ConsoleLogger,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  DiscoveredDevice,
  TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import {
  webBleIdentifier,
  webBleTransportFactory,
} from "@ledgerhq/device-transport-kit-web-ble";
import {
  webHidIdentifier,
  webHidTransportFactory,
} from "@ledgerhq/device-transport-kit-web-hid";
import { type Factory, inject, injectable } from "inversify";
import { firstValueFrom } from "rxjs";

import { type DeviceModuleOptions } from "../../diTypes.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";
import { Device, mapConnectedDeviceToDevice } from "../model/Device.js";
import { DeviceConnectionError } from "../model/errors.js";
import { DeviceManagementKitService } from "./DeviceManagementKitService.js";

export type ConnectionType = "bluetooth" | "usb" | "";

@injectable()
export class DefaultDeviceManagementKitService
  implements DeviceManagementKitService
{
  private readonly logger: LoggerPublisher;
  private readonly _dmk: DeviceManagementKit;
  public hidIdentifier: TransportIdentifier = webHidIdentifier;
  public bleIdentifier: TransportIdentifier = webBleIdentifier;
  private _currentSessionId?: string;
  private _connectedDevice?: Device;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DmkConfig)
    args: DeviceModuleOptions,
  ) {
    this.logger = loggerFactory("[DeviceManagementKit Service]");
    const builder = new DeviceManagementKitBuilder();

    builder
      .addConfig(args)
      .addLogger(new ConsoleLogger())
      .addTransport(webHidTransportFactory)
      .addTransport(webBleTransportFactory);

    this._dmk = builder.build();
  }

  get dmk() {
    return this._dmk;
  }

  get sessionId() {
    return this._currentSessionId;
  }

  get connectedDevice() {
    return this._connectedDevice;
  }

  async connectToDevice({ type }: { type: ConnectionType }) {
    const identifier = type === "usb" ? this.hidIdentifier : this.bleIdentifier;
    this.logger.debug(`Connecting to device`, { identifier });

    const dmk = this.dmk;
    let device: DiscoveredDevice;
    try {
      device = await firstValueFrom(
        dmk.startDiscovering({ transport: identifier }),
      );
      await dmk.stopDiscovering();
    } catch (error) {
      this.logger.error(`Failed to start discovery`, { error });
      throw new DeviceConnectionError(`Failed to start discovery`, { error });
    }

    try {
      const sessionId = await dmk.connect({
        device,
        sessionRefresherOptions: {
          isRefresherDisabled: true,
        },
      });
      this._currentSessionId = sessionId;
      this._connectedDevice = mapConnectedDeviceToDevice(
        await dmk.getConnectedDevice({ sessionId }),
      );
      return sessionId;
    } catch (error) {
      this.logger.error(`Failed to connect to device`, { error });
      throw new DeviceConnectionError(`Failed to connect to device`, {
        error,
      });
    }
  }

  async disconnectFromDevice() {
    if (!this._currentSessionId) {
      return;
    }

    try {
      await this.dmk.disconnect({
        sessionId: this._currentSessionId,
      });
      this._currentSessionId = undefined;
    } catch (error) {
      this.logger.error(`Failed to disconnect from device`, { error });
      throw new DeviceConnectionError(`Failed to disconnect from device`, {
        error,
      });
    }
  }
}
