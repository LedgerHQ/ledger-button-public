import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asMockService,
  createMockDeviceManagementKitService,
  createMockLoggerFactory,
  mockDiscoveredDevices,
} from "../__tests__/mocks";
import { ListAvailableDevicesUseCase } from "./ListAvailableDevicesUseCase";

describe("ListAvailableDevices", () => {
  let listAvailableDevices: ListAvailableDevicesUseCase;
  let mockDeviceManagementKitService: ReturnType<
    typeof createMockDeviceManagementKitService
  >;

  beforeEach(() => {
    mockDeviceManagementKitService = createMockDeviceManagementKitService();

    listAvailableDevices = new ListAvailableDevicesUseCase(
      createMockLoggerFactory(),
      asMockService(mockDeviceManagementKitService),
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    describe("successful device listing", () => {
      it.each([
        {
          description: "with available devices",
          devices: mockDiscoveredDevices,
        },
        {
          description: "with no devices",
          devices: [],
        },
      ])("should return list of devices $description", async ({ devices }) => {
        mockDeviceManagementKitService.listAvailableDevices.mockResolvedValue(
          devices,
        );

        const result = await listAvailableDevices.execute();

        expect(
          mockDeviceManagementKitService.listAvailableDevices,
        ).toHaveBeenCalledTimes(1);
        expect(result).toEqual(devices);
      });
    });
  });
});
