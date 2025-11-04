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
    mockDeviceManagementKitService = {
      connectToDevice: vi.fn(),
      disconnectFromDevice: vi.fn(),
      listAvailableDevices: vi.fn(),
      dmk: {},
    };

    listAvailableDevices = new ListAvailableDevices(
      vi.fn(),
      mockDeviceManagementKitService as unknown as DeviceManagementKitService,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    describe("successful device listing", () => {
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
        mockDeviceManagementKitService.listAvailableDevices.mockResolvedValue(
          [],
        );

        const result = await listAvailableDevices.execute();

        expect(result).toEqual([]);
      });
    });

    describe("error handling", () => {
      it("should handle service errors gracefully", async () => {
        const error = new Error("Service unavailable");
        mockDeviceManagementKitService.listAvailableDevices.mockRejectedValue(
          error,
        );

        try {
          await listAvailableDevices.execute();
          expect.fail("Should have thrown an error");
        } catch (err) {
          expect(err).toBeInstanceOf(Error);
          expect((err as Error).message).toBe("Service unavailable");
        }
      });
    });
  });
});
