import { mapToKnownDeviceDbModel, type KnownDeviceDbModel } from "./knownDeviceDbModel.js";

describe("knownDeviceDbModel", () => {
  describe("mapToKnownDeviceDbModel", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T12:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should create a KnownDeviceDbModel with all required fields", () => {
      const device = {
        name: "My Ledger Flex",
        modelId: "FLEX",
        type: "ble",
      };

      const result = mapToKnownDeviceDbModel(device);

      expect(result.name).toBe("My Ledger Flex");
      expect(result.modelId).toBe("FLEX");
      expect(result.type).toBe("ble");
      expect(result.firstConnectedAt).toBe(Date.now());
      expect(result.lastConnectedAt).toBe(Date.now());
    });

    it("should generate an id when not provided", () => {
      const device = {
        name: "My Ledger Flex",
        modelId: "FLEX",
        type: "ble",
      };

      const result = mapToKnownDeviceDbModel(device);

      expect(result.id).toBe(`My Ledger Flex-ble-${Date.now()}`);
    });

    it("should use the provided id when given", () => {
      const device = {
        id: "custom-device-id",
        name: "My Ledger Flex",
        modelId: "FLEX",
        type: "ble",
      };

      const result = mapToKnownDeviceDbModel(device);

      expect(result.id).toBe("custom-device-id");
    });

    it("should handle USB device type", () => {
      const device = {
        name: "Ledger Nano X",
        modelId: "NANO_X",
        type: "usb",
      };

      const result = mapToKnownDeviceDbModel(device);

      expect(result.type).toBe("usb");
      expect(result.id).toContain("-usb-");
    });

    it("should set firstConnectedAt and lastConnectedAt to the same timestamp", () => {
      const device = {
        name: "My Ledger Stax",
        modelId: "STAX",
        type: "ble",
      };

      const result = mapToKnownDeviceDbModel(device);

      expect(result.firstConnectedAt).toBe(result.lastConnectedAt);
    });

    it("should return a properly typed KnownDeviceDbModel", () => {
      const device = {
        name: "Test Device",
        modelId: "FLEX",
        type: "ble",
      };

      const result: KnownDeviceDbModel = mapToKnownDeviceDbModel(device);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("modelId");
      expect(result).toHaveProperty("type");
      expect(result).toHaveProperty("firstConnectedAt");
      expect(result).toHaveProperty("lastConnectedAt");
    });
  });
});
