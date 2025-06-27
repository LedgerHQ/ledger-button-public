import { inject, injectable } from "inversify";

import { deviceModuleTypes } from "../deviceModuleTypes.js";
import { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";

@injectable()
export class ConnectDevice {
  constructor(
    @inject(deviceModuleTypes.DeviceManagementKitService)
    private readonly deviceManagementKitService: DeviceManagementKitService,
  ) {}

  async execute({ type }: { type: "usb" | "ble" }): Promise<string> {
    const identifier =
      type === "usb"
        ? this.deviceManagementKitService.usbIdentifier
        : this.deviceManagementKitService.bleIdentifier;

    const dmk = this.deviceManagementKitService.dmk;
    return new Promise((resolve, reject) => {
      dmk.startDiscovering({ transport: identifier }).subscribe({
        next: (device) => {
          dmk
            .connect({ device })
            .then((sessionId) => {
              resolve(sessionId);
            })
            .catch((error) => {
              console.error(error);
              reject(error);
            });
        },
      });
    });
  }
}
