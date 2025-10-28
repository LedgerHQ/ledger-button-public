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
  let mockLogger: {
    log: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };
  let mockLoggerFactory: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
    };

    mockLoggerFactory = vi.fn().mockReturnValue(mockLogger);

    mockDeviceManagementKitService = {
      connectToDevice: vi.fn(),
      disconnectFromDevice: vi.fn(),
      listAvailableDevices: vi.fn(),
      dmk: {},
    };

    switchDevice = new SwitchDevice(
      mockLoggerFactory,
      mockDeviceManagementKitService as unknown as DeviceManagementKitService,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should switch to USB device successfully", async () => {
      mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
        undefined,
      );
      mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
        undefined,
      );

      await switchDevice.execute({ type: "usb" });

      expect(
        mockDeviceManagementKitService.disconnectFromDevice,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockDeviceManagementKitService.connectToDevice,
      ).toHaveBeenCalledWith({ type: "usb" });
    });

    it("should switch to Bluetooth device successfully", async () => {
      mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
        undefined,
      );
      mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
        undefined,
      );

      await switchDevice.execute({ type: "bluetooth" });

      expect(
        mockDeviceManagementKitService.disconnectFromDevice,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockDeviceManagementKitService.connectToDevice,
      ).toHaveBeenCalledWith({ type: "bluetooth" });
    });

    it("should throw error if disconnect fails", async () => {
      const disconnectError = new Error("Failed to disconnect");
      mockDeviceManagementKitService.disconnectFromDevice.mockRejectedValue(
        disconnectError,
      );

      await expect(switchDevice.execute({ type: "usb" })).rejects.toThrow(
        disconnectError,
      );

      expect(
        mockDeviceManagementKitService.connectToDevice,
      ).not.toHaveBeenCalled();
    });

    it("should throw error if connect fails after successful disconnect", async () => {
      const connectError = new Error("Failed to connect");
      mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
        undefined,
      );
      mockDeviceManagementKitService.connectToDevice.mockRejectedValue(
        connectError,
      );

      await expect(switchDevice.execute({ type: "bluetooth" })).rejects.toThrow(
        connectError,
      );

      expect(
        mockDeviceManagementKitService.disconnectFromDevice,
      ).toHaveBeenCalledTimes(1);
    });

    it("should propagate device connection errors", async () => {
      const connectionError = new Error("Device connection error");
      mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
        undefined,
      );
      mockDeviceManagementKitService.connectToDevice.mockRejectedValue(
        connectionError,
      );

      await expect(switchDevice.execute({ type: "usb" })).rejects.toThrow(
        "Device connection error",
      );
    });

    it("should switch between different connection types", async () => {
      mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
        undefined,
      );
      mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
        undefined,
      );

      await switchDevice.execute({ type: "usb" });
      expect(
        mockDeviceManagementKitService.connectToDevice,
      ).toHaveBeenLastCalledWith({ type: "usb" });

      await switchDevice.execute({ type: "bluetooth" });
      expect(
        mockDeviceManagementKitService.connectToDevice,
      ).toHaveBeenLastCalledWith({ type: "bluetooth" });
    });
  });
});
