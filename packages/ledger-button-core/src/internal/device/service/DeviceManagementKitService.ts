import {
  DeviceManagementKit,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";

import { Device } from "../model/Device.js";

export type ConnectionType = "bluetooth" | "usb" | "";

export interface DeviceManagementKitService {
  dmk: DeviceManagementKit;
  sessionId: string | undefined;
  connectedDevice: Device | undefined;

  connectToDevice: ({ type }: { type: ConnectionType }) => Promise<string>;
  disconnectFromDevice: () => Promise<void>;
  listAvailableDevices: () => Promise<DiscoveredDevice[]>;
}
