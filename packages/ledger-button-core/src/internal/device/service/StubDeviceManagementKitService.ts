import {
  DeviceManagementKit,
  DeviceModelId,
} from "@ledgerhq/device-management-kit";
import { injectable } from "inversify";

import { Device } from "../model/Device.js";
import { DeviceManagementKitService } from "./DeviceManagementKitService.js";

@injectable()
export class StubDeviceManagementKitService
  implements DeviceManagementKitService
{
  dmk: DeviceManagementKit = {} as DeviceManagementKit;
  sessionId: string | undefined = "session-id-123";
  connectedDevice: Device | undefined;
  connectToDevice = () => Promise.resolve("session-id-123");
  disconnectFromDevice = () => Promise.resolve();
  listAvailableDevices = () =>
    Promise.resolve([
      {
        id: "123",
        name: "Yolo Flex",
        deviceModel: {
          id: "flex-123",
          model: DeviceModelId.FLEX,
          name: "Yolo Flex",
        },
        transport: "BLE",
      },
    ]);
}
