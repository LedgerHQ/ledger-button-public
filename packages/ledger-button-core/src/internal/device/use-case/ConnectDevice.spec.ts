import {
  ConnectedDevice,
  DeviceModelId,
} from "@ledgerhq/device-management-kit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeviceNotSupportedError } from "../../../api/errors/DeviceErrors.js";
import { Device } from "../model/Device.js";
import type { DeviceManagementKitService } from "../service/DeviceManagementKitService.js";
import { ConnectDevice } from "./ConnectDevice.js";

describe("ConnectDevice", () => {
  let connectDevice: ConnectDevice;
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

  const mockUsbDevice: Device = new Device({
    name: "Nano X",
    modelId: DeviceModelId.NANO_X,
    sessionId: "session-123",
    type: "USB",
    id: "device-1",
  } as ConnectedDevice);

  const mockBleDevice = new Device({
    name: "Flex",
    modelId: DeviceModelId.FLEX,
    sessionId: "session-456",
    type: "BLE",
    id: "device-2",
  } as ConnectedDevice);

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

    connectDevice = new ConnectDevice(
      mockLoggerFactory,
      mockDeviceManagementKitService as unknown as DeviceManagementKitService,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should connect to USB device successfully", async () => {
      mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
        mockUsbDevice,
      );

      const result = await connectDevice.execute({ type: "usb" });

      expect(result).toBe(mockUsbDevice);
      expect(
        mockDeviceManagementKitService.connectToDevice,
      ).toHaveBeenCalledWith({ type: "usb" });
    });

    it("should connect to Bluetooth device successfully", async () => {
      mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
        mockBleDevice,
      );

      const result = await connectDevice.execute({ type: "bluetooth" });

      expect(result).toBe(mockBleDevice);
      expect(
        mockDeviceManagementKitService.connectToDevice,
      ).toHaveBeenCalledWith({ type: "bluetooth" });
    });

    it("should throw DeviceNotSupportedError for NANO_S device", async () => {
      const mockDevice: Device = new Device({
        name: "Nano S",
        modelId: DeviceModelId.NANO_S,
        sessionId: "session-123",
        type: "USB",
        id: "device-1",
      } as ConnectedDevice);

      mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
        mockDevice,
      );
      mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
        undefined,
      );

      await expect(connectDevice.execute({ type: "usb" })).rejects.toThrow(
        DeviceNotSupportedError,
      );

      await expect(connectDevice.execute({ type: "usb" })).rejects.toThrow(
        "Device not supported",
      );
    });

    it("should disconnect when NANO_S device is detected", async () => {
      const mockDevice = new Device({
        name: "Nano S",
        modelId: DeviceModelId.NANO_S,
        sessionId: "session-123",
        type: "USB",
        id: "device-1",
      } as ConnectedDevice);

      mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
        mockDevice,
      );
      mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
        undefined,
      );

      try {
        await connectDevice.execute({ type: "usb" });
      } catch {
        // Expected to throw
      }

      expect(
        mockDeviceManagementKitService.disconnectFromDevice,
      ).toHaveBeenCalled();
    });

    it("should include modelId in error context for NANO_S", async () => {
      const mockDevice = new Device({
        name: "Nano S",
        modelId: DeviceModelId.NANO_S,
        sessionId: "session-123",
        type: "USB",
        id: "device-1",
      } as ConnectedDevice);

      mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
        mockDevice,
      );
      mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
        undefined,
      );

      try {
        await connectDevice.execute({ type: "usb" });
      } catch (error) {
        expect(error).toBeInstanceOf(DeviceNotSupportedError);
        expect((error as DeviceNotSupportedError).context?.modelId).toBe(
          DeviceModelId.NANO_S,
        );
      }
    });

    it("should propagate connection errors", async () => {
      const connectionError = new Error("Connection failed");
      mockDeviceManagementKitService.connectToDevice.mockRejectedValue(
        connectionError,
      );

      await expect(connectDevice.execute({ type: "usb" })).rejects.toThrow(
        connectionError,
      );
    });
  });
});
