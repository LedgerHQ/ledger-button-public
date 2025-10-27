import {
  ConnectedDevice,
  DeviceModelId,
} from "@ledgerhq/device-management-kit";
import { describe, expect, it } from "vitest";

import { Device } from "./Device.js";

describe("Device", () => {
  const mockConnectedDevice = (
    overrides: Partial<ConnectedDevice> = {}
  ): ConnectedDevice => ({
    name: "Test Device",
    modelId: DeviceModelId.FLEX,
    sessionId: "session-123",
    type: "USB",
    id: "device-1",
    ...overrides,
  } as ConnectedDevice);
  describe("getters", () => {
    it("should return the connected device", () => {
      const device = new Device(mockConnectedDevice());

      expect(device.name).toBe("Test Device");
      expect(device.modelId).toBe(DeviceModelId.FLEX);
      expect(device.sessionId).toBe("session-123");
      expect(device.type).toBe("USB");
    });
  });

  describe("iconType", () => {
    it("should return 'nanox' for NANO_X device", () => {
      const device = new Device(mockConnectedDevice({
        name: "Nano X",
        modelId: DeviceModelId.NANO_X,
      }));

      expect(device.iconType).toBe("nanox");
    });

    it("should return 'nanox' for NANO_S device", () => {
      const device = new Device(mockConnectedDevice({
        name: "Nano S",
        modelId: DeviceModelId.NANO_S,
      }));

      expect(device.iconType).toBe("nanox");
    });

    it("should return 'nanox' for NANO_SP device", () => {
      const device = new Device(mockConnectedDevice({
        name: "Nano SP",
        modelId: DeviceModelId.NANO_SP,
      }));

      expect(device.iconType).toBe("nanox");
    });

    it("should return 'stax' for STAX device", () => {
      const device = new Device(mockConnectedDevice({
        name: "Stax",
        modelId: DeviceModelId.STAX,
      }));

      expect(device.iconType).toBe("stax");
    });

    it("should return 'flex' for FLEX device", () => {
      const device = new Device(mockConnectedDevice({
        name: "Flex",
        modelId: DeviceModelId.FLEX,
        type: "BLE",
      }));

      expect(device.iconType).toBe("flex");
    });

    it("should return 'apexp' for APEX device", () => {
      const device = new Device(mockConnectedDevice({
        name: "Apex",
        modelId: DeviceModelId.APEX,
      }));

      expect(device.iconType).toBe("apexp");
    });
  });

  describe("multiple devices", () => {
    it("should handle different devices independently", () => {
      const device1 = new Device(mockConnectedDevice({
        name: "Device 1",
        modelId: DeviceModelId.NANO_X,
        sessionId: "session-1",
        id: "device-1",
      }));

      const device2 = new Device(mockConnectedDevice({
        name: "Device 2",
        modelId: DeviceModelId.STAX,
        sessionId: "session-2",
        type: "BLE",
        id: "device-2",
      }));

      expect(device1.name).toBe("Device 1");
      expect(device1.iconType).toBe("nanox");
      expect(device2.name).toBe("Device 2");
      expect(device2.iconType).toBe("stax");
    });
  });
});
