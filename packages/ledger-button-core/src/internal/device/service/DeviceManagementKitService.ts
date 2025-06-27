import {
  ConsoleLogger,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
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
import { inject, injectable } from "inversify";

import { type DeviceModuleOptions } from "../../diTypes.js";
import { deviceModuleTypes } from "../deviceModuleTypes.js";

@injectable()
export class DeviceManagementKitService {
  private _dmk: DeviceManagementKit;
  public usbIdentifier: TransportIdentifier = webHidIdentifier;
  public bleIdentifier: TransportIdentifier = webBleIdentifier;

  constructor(
    @inject(deviceModuleTypes.DmkConfig)
    args: DeviceModuleOptions,
  ) {
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
}
