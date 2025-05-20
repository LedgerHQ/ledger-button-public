import {
  type DeviceManagementKit,
  type DeviceSessionId,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { Observable } from "rxjs";

export interface LedgerButtonDmk {
  dmk: DeviceManagementKit;
  discoverHidDevices: ({
    dmk,
  }: {
    dmk: DeviceManagementKit;
  }) => Observable<DiscoveredDevice>;
  discoverBleDevices: ({
    dmk,
  }: {
    dmk: DeviceManagementKit;
  }) => Observable<DiscoveredDevice>;
  connectToDevice: ({
    dmk,
    device,
  }: {
    dmk: DeviceManagementKit;
    device: DiscoveredDevice;
  }) => Promise<DeviceSessionId>;
}
