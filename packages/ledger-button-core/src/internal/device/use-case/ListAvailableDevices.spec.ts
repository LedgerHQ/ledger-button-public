import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asMockService,
  createMockDeviceManagementKitService,
  createMockLoggerFactory,
  mockDiscoveredDevices,
} from "../__tests__/mocks.js";
import { ListAvailableDevices } from "./ListAvailableDevices.js";

describe("ListAvailableDevices", () => {
  let listAvailableDevices: ListAvailableDevices;
  let mockDeviceManagementKitService: ReturnType<
    typeof createMockDeviceManagementKitService
  >;

  beforeEach(() => {
    mockDeviceManagementKitService = createMockDeviceManagementKitService();

    listAvailableDevices = new ListAvailableDevices(
      createMockLoggerFactory(),
      asMockService(mockDeviceManagementKitService),
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
