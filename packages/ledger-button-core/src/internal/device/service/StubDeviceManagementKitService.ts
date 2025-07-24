import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { injectable } from "inversify";

import { DeviceManagementKitService } from "./DeviceManagementKitService.js";

@injectable()
export class StubDeviceManagementKitService
  implements DeviceManagementKitService
{
  dmk = {} as DeviceManagementKit;
  sessionId = "session-id-123";
  connectedDevice = {
    name: "Yolo Flex",
    sessionId: "session-id-123",
    modelId: "flex",
    type: "BLE",
  } as const;
  connectToDevice = () => Promise.resolve("session-id-123");
  disconnectFromDevice = () => Promise.resolve();
}
