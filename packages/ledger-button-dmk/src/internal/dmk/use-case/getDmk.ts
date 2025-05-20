import {
  ConsoleLogger,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
} from "@ledgerhq/device-management-kit";
import { webBleTransportFactory } from "@ledgerhq/device-transport-kit-web-ble";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";

let dmk: DeviceManagementKit;

export function getDmk(): DeviceManagementKit {
  if (!dmk) {
    const builder = new DeviceManagementKitBuilder();

    builder
      .addLogger(new ConsoleLogger())
      .addTransport(webHidTransportFactory)
      .addTransport(webBleTransportFactory);

    dmk = builder.build();
  }

  return dmk;
}
