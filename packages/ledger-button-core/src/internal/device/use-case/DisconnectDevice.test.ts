import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asMockService,
  createMockDeviceManagementKitService,
  createMockLoggerFactory,
} from "../__tests__/mocks";
import { DisconnectDevice } from "./DisconnectDevice";

describe("DisconnectDevice", () => {
  let disconnectDevice: DisconnectDevice;
  let mockDeviceManagementKitService: ReturnType<
    typeof createMockDeviceManagementKitService
  >;

  beforeEach(() => {
    mockDeviceManagementKitService = createMockDeviceManagementKitService();

    disconnectDevice = new DisconnectDevice(
      createMockLoggerFactory(),
      asMockService(mockDeviceManagementKitService),
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
  });
});
