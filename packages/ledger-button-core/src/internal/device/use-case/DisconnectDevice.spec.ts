import { beforeEach, describe, expect, it, vi } from "vitest";

import { Device } from "../model/Device.js";
import type { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";
import { DisconnectDevice } from "./DisconnectDevice.js";

describe("DisconnectDevice", () => {
  let disconnectDevice: DisconnectDevice;
  let mockDeviceManagementKitService: {
    connectToDevice: ReturnType<typeof vi.fn>;
    disconnectFromDevice: ReturnType<typeof vi.fn>;
    listAvailableDevices: ReturnType<typeof vi.fn>;
    dmk: unknown;
    sessionId?: string;
    connectedDevice?: Device;
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

    disconnectDevice = new DisconnectDevice(
      mockLoggerFactory,
      mockDeviceManagementKitService as unknown as DeviceManagementKitService,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should disconnect from device successfully", async () => {
      mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
        undefined,
      );

      const result = await disconnectDevice.execute();

      expect(
        mockDeviceManagementKitService.disconnectFromDevice,
      ).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it("should propagate errors from device service", async () => {
      const error = new Error("Failed to disconnect");
      mockDeviceManagementKitService.disconnectFromDevice.mockRejectedValue(
        error,
      );

      await expect(disconnectDevice.execute()).rejects.toThrow(error);
    });

    it("should handle device connection errors", async () => {
      const error = new Error("Device connection error");
      mockDeviceManagementKitService.disconnectFromDevice.mockRejectedValue(
        error,
      );

      await expect(disconnectDevice.execute()).rejects.toThrow(
        "Device connection error",
      );
    });
  });

  describe("multiple calls", () => {
    it("should handle multiple disconnect calls", async () => {
      mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
        undefined,
      );

      await disconnectDevice.execute();
      await disconnectDevice.execute();
      await disconnectDevice.execute();

      expect(
        mockDeviceManagementKitService.disconnectFromDevice,
      ).toHaveBeenCalledTimes(3);
    });
  });
});
