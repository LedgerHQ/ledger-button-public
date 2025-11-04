import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";
import { SwitchDevice } from "./SwitchDevice.js";

describe("SwitchDevice", () => {
  let switchDevice: SwitchDevice;
  let mockDeviceManagementKitService: {
    connectToDevice: ReturnType<typeof vi.fn>;
    disconnectFromDevice: ReturnType<typeof vi.fn>;
    listAvailableDevices: ReturnType<typeof vi.fn>;
    dmk: unknown;
  };

  beforeEach(() => {
    mockDeviceManagementKitService = {
      connectToDevice: vi.fn(),
      disconnectFromDevice: vi.fn(),
      listAvailableDevices: vi.fn(),
      dmk: {},
    };

    const mockLoggerFactory = vi.fn().mockReturnValue({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
    });

    switchDevice = new SwitchDevice(
      mockLoggerFactory,
      mockDeviceManagementKitService as unknown as DeviceManagementKitService,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    describe("successful device switching", () => {
      beforeEach(() => {
        mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
          undefined,
        );
        mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
          undefined,
        );
      });

      it.each([
        { type: "usb" as const, description: "USB" },
        { type: "bluetooth" as const, description: "Bluetooth" },
      ])(
        "should switch to $description device successfully",
        async ({ type }) => {
          await switchDevice.execute({ type });

          expect(
            mockDeviceManagementKitService.disconnectFromDevice,
          ).toHaveBeenCalledTimes(1);
          expect(
            mockDeviceManagementKitService.connectToDevice,
          ).toHaveBeenCalledWith({ type });
        },
      );
    });

    describe("error handling", () => {
      it("should throw error if connect fails after successful disconnect", async () => {
        const connectError = new Error("Failed to connect");
        mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
          undefined,
        );
        mockDeviceManagementKitService.connectToDevice.mockRejectedValue(
          connectError,
        );

        await expect(
          switchDevice.execute({ type: "bluetooth" }),
        ).rejects.toThrow(connectError);

        expect(
          mockDeviceManagementKitService.disconnectFromDevice,
        ).toHaveBeenCalledTimes(1);
      });
    });
  });
});
