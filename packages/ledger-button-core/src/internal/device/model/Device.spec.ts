import {
  ConnectedDevice,
  DeviceModelId,
} from "@ledgerhq/device-management-kit";
import { describe, expect, it } from "vitest";

import { Device } from "./Device.js";

describe("Device", () => {
  const mockConnectedDevice = (
    overrides: Partial<ConnectedDevice> = {},
  ): ConnectedDevice =>
    ({
      name: "Test Device",
      modelId: DeviceModelId.FLEX,
      sessionId: "session-123",
      type: "USB",
      id: "device-1",
      ...overrides,
    }) as ConnectedDevice;
  describe("getters", () => {
    it("should return the connected device", () => {
      const device = new Device(mockConnectedDevice());

      expect(device).toMatchObject({
        name: "Test Device",
        modelId: DeviceModelId.FLEX,
        sessionId: "session-123",
        type: "USB",
      });
    });
  });

  describe("iconType", () => {
    it.each([
      { name: "Nano X", modelId: DeviceModelId.NANO_X, expected: "nanox" },
      { name: "Nano S", modelId: DeviceModelId.NANO_S, expected: "nanox" },
      { name: "Nano SP", modelId: DeviceModelId.NANO_SP, expected: "nanox" },
      { name: "Stax", modelId: DeviceModelId.STAX, expected: "stax" },
      { name: "Flex", modelId: DeviceModelId.FLEX, expected: "flex" },
      { name: "Apex", modelId: DeviceModelId.APEX, expected: "apexp" },
    ])(
      "should return '$expected' for $name device",
      ({ name, modelId, expected }) => {
        const device = new Device(mockConnectedDevice({ name, modelId }));

        expect(device.iconType).toBe(expected);
      },
    );
  });

  describe("multiple devices", () => {
    it("should handle different devices independently", () => {
      const device1 = new Device(
        mockConnectedDevice({
          name: "Device 1",
          modelId: DeviceModelId.NANO_X,
          sessionId: "session-1",
          id: "device-1",
        }),
      );

      const device2 = new Device(
        mockConnectedDevice({
          name: "Device 2",
          modelId: DeviceModelId.STAX,
          sessionId: "session-2",
          type: "BLE",
          id: "device-2",
        }),
      );

      expect(device1.name).toBe("Device 1");
      expect(device1.iconType).toBe("nanox");
      expect(device2.name).toBe("Device 2");
      expect(device2.iconType).toBe("stax");
    });
  });
});
