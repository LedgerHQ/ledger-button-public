import {
  DeviceModelId,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Device } from "../model/Device.js";
import type { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";
import { ListAvailableDevices } from "./ListAvailableDevices.js";

describe("ListAvailableDevices", () => {
  let listAvailableDevices: ListAvailableDevices;
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

  const mockDiscoveredDevices: DiscoveredDevice[] = [
    {
      id: "device-1",
      name: "Nano X",
      deviceModel: {
        id: "nano-x-001",
        model: DeviceModelId.NANO_X,
        name: "Nano X",
      },
      transport: "USB",
    },
    {
      id: "device-2",
      name: "Flex",
      deviceModel: {
        id: "flex-001",
        model: DeviceModelId.FLEX,
        name: "Flex",
      },
      transport: "BLE",
    },
  ];

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

    listAvailableDevices = new ListAvailableDevices(
      mockLoggerFactory,
      mockDeviceManagementKitService as unknown as DeviceManagementKitService,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should return list of available devices", async () => {
      mockDeviceManagementKitService.listAvailableDevices.mockResolvedValue(
        mockDiscoveredDevices,
      );

      const result = await listAvailableDevices.execute();

      expect(
        mockDeviceManagementKitService.listAvailableDevices,
      ).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(mockDiscoveredDevices.length);
      expect(result).toEqual(mockDiscoveredDevices);
    });

    it("should return empty array when no devices are available", async () => {
      mockDeviceManagementKitService.listAvailableDevices.mockResolvedValue([]);

      const result = await listAvailableDevices.execute();

      expect(result).toEqual([]);
    });

    it("should return single device when only one is available", async () => {
      const singleDevice = [mockDiscoveredDevices[0]];
      mockDeviceManagementKitService.listAvailableDevices.mockResolvedValue(
        singleDevice,
      );

      const result = await listAvailableDevices.execute();

      expect(result).toEqual(singleDevice);
      expect(result).toHaveLength(singleDevice.length);
    });

    it("should preserve device properties", async () => {
      mockDeviceManagementKitService.listAvailableDevices.mockResolvedValue(
        mockDiscoveredDevices,
      );

      const result = await listAvailableDevices.execute();

      result.forEach((device: DiscoveredDevice, i: number) => {
        expect(device.id).toBe(mockDiscoveredDevices[i].id);
        expect(device.name).toBe(mockDiscoveredDevices[i].name);
        expect(device.deviceModel.model).toBe(
          mockDiscoveredDevices[i].deviceModel.model,
        );
        expect(device.transport).toBe(mockDiscoveredDevices[i].transport);
      });
    });

    it("should propagate errors from device service", async () => {
      const error = new Error("Failed to list devices");
      mockDeviceManagementKitService.listAvailableDevices.mockRejectedValue(
        error,
      );

      await expect(listAvailableDevices.execute()).rejects.toThrow(error);
    });

    it("should handle service errors gracefully", async () => {
      const error = new Error("Service unavailable");
      mockDeviceManagementKitService.listAvailableDevices.mockRejectedValue(
        error,
      );

      await expect(listAvailableDevices.execute()).rejects.toThrow(
        "Service unavailable",
      );
    });
  });
});
