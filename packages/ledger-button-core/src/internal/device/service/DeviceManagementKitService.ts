import {
  ConsoleLogger,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  DeviceSessionId,
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

import { type DeviceModuleOptions } from "../../diTypes.js";
import { loggerModuleTypes } from "../../logger/loggerModuleTypes.js";
import { type LoggerPublisher } from "../../logger/service/LoggerPublisher.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";

@injectable()
export class DeviceManagementKitService {
  private readonly logger: LoggerPublisher;
  private readonly _dmk: DeviceManagementKit;
  public hidIdentifier: TransportIdentifier = webHidIdentifier;
  public bleIdentifier: TransportIdentifier = webBleIdentifier;
  private _currentSessionId?: string;

  constructor(
    @inject(loggerModuleTypes.LoggerPublisher)
    loggerFactory: Factory<LoggerPublisher>,
    @inject(deviceModuleTypes.DmkConfig)
    args: DeviceModuleOptions,
  ) {
    this.logger = loggerFactory("DeviceManagementKitService");
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

  async connectToDevice({ type }: { type: "hid" | "ble" }) {
    const identifier = type === "hid" ? this.hidIdentifier : this.bleIdentifier;
    this.logger.debug(`Connecting to device`, { identifier });

    const dmk = this.dmk;
    return new Promise<DeviceSessionId>((resolve, reject) => {
      this.logger.debug(`Starting discovery`, { identifier });
      dmk.startDiscovering({ transport: identifier }).subscribe({
        next: (device) => {
          this.logger.debug(`Found device`, { device });
          dmk
            .connect({ device })
            .then((sessionId) => {
              this.logger.debug(`Connected to device`, { sessionId });
              this._currentSessionId = sessionId;
              resolve(sessionId);
            })
            .catch((error) => {
              this.logger.error(`Failed to connect to device`, { error });
              reject(error);
            })
            .finally(async () => {
              await dmk.stopDiscovering();
            });
        },
        error: async (error) => {
          this.logger.error(`Failed to start discovery`, { error });
          await dmk.stopDiscovering();
          reject(error);
        },
      });
    });
  }

  async disconnectFromDevice() {
    if (!this._currentSessionId) {
      return;
    }
    try {
      await this.dmk.disconnect({ sessionId: this._currentSessionId });
      this._currentSessionId = undefined;
    } catch (error) {
      this.logger.error(`Failed to disconnect from device`, { error });
      throw error;
    }
  }
}
