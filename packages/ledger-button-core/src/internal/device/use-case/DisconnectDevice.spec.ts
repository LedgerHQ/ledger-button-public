import { beforeEach, describe, expect, it, vi } from "vitest";

import { Device } from "../model/Device.js";
import { DeviceConnectionError } from "../model/errors.js";
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

  beforeEach(() => {
    mockDeviceManagementKitService = {
      connectToDevice: vi.fn(),
      disconnectFromDevice: vi.fn(),
      listAvailableDevices: vi.fn(),
      dmk: {},
    };

    disconnectDevice = new DisconnectDevice(
      () => ({
        subscribers: [],
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        fatal: vi.fn(),
      }),
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

    it("should handle device connection errors", async () => {
      const error = new DeviceConnectionError("Device connection error");
      mockDeviceManagementKitService.disconnectFromDevice.mockRejectedValue(
        error,
      );

      await expect(disconnectDevice.execute()).rejects.toThrow(
        DeviceConnectionError,
      );
    });
  });
});
