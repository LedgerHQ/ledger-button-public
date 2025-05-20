import {
  DeviceManagementKit,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { webBleIdentifier } from "@ledgerhq/device-transport-kit-web-ble";
import { webHidIdentifier } from "@ledgerhq/device-transport-kit-web-hid";
import { Observable } from "rxjs";

export function discoverHidDevices({
  dmk,
}: {
  dmk: DeviceManagementKit;
}): Observable<DiscoveredDevice> {
  return dmk.startDiscovering({ transport: webHidIdentifier });
}

export function discoverBleDevices({
  dmk,
}: {
  dmk: DeviceManagementKit;
}): Observable<DiscoveredDevice> {
  return dmk.startDiscovering({ transport: webBleIdentifier });
}
