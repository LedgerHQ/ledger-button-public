import {
  ConnectedDevice,
  DeviceManagementKit,
  DeviceModelId,
  DiscoveredDevice,
  NoAccessibleDeviceError,
} from "@ledgerhq/device-management-kit";
import { Observable, of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeviceConnectionError } from "../model/errors.js";
import { DefaultDeviceManagementKitService } from "./DefaultDeviceManagementKitService.js";

// Mock the device-management-kit module
vi.mock("@ledgerhq/device-management-kit", async () => {
  const actual = await vi.importActual("@ledgerhq/device-management-kit");
  return {
    ...actual,
    DeviceManagementKitBuilder: vi.fn().mockImplementation(() => ({
      addConfig: vi.fn().mockReturnThis(),
      addLogger: vi.fn().mockReturnThis(),
      addTransport: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({
        startDiscovering: vi.fn(),
        stopDiscovering: vi.fn(),
        connect: vi.fn(),
        getConnectedDevice: vi.fn(),
        close: vi.fn(),
        listenToAvailableDevices: vi.fn(),
      }),
    })),
    ConsoleLogger: vi.fn(),
    LogLevel: {
      Error: "Error",
    },
  };
});

describe("DefaultDeviceManagementKitService", () => {
  let service: DefaultDeviceManagementKitService;
  let mockDmk: DeviceManagementKit;
  let mockLogger: {
    log: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };
  let mockLoggerFactory: ReturnType<typeof vi.fn>;

  const mockDiscoveredDevice: DiscoveredDevice = {
    id: "device-1",
    name: "Test Device",
    deviceModel: {
      id: "nano-x-001",
      model: DeviceModelId.NANO_X,
      name: "Nano X",
    },
    transport: "USB",
  };

  const mockConnectedDevice: ConnectedDevice = {
    id: "device-1",
    name: "Test Device",
    modelId: DeviceModelId.FLEX,
    sessionId: "session-123",
    type: "USB",
  } as ConnectedDevice;

  beforeEach(() => {
    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    mockLoggerFactory = vi.fn().mockReturnValue(mockLogger);

    service = new DefaultDeviceManagementKitService(mockLoggerFactory, {});

    mockDmk = service.dmk;

    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should have dmk property", () => {
      expect(service.dmk).toBeDefined();
    });

    it("should initialize with no session ID", () => {
      expect(service.sessionId).toBeUndefined();
    });

    it("should initialize with no connected device", () => {
      expect(service.connectedDevice).toBeUndefined();
    });
  });

  describe("connectToDevice", () => {
    beforeEach(() => {
      vi.mocked(mockDmk.startDiscovering).mockReturnValue(
        of(mockDiscoveredDevice) as Observable<DiscoveredDevice>,
      );
      vi.mocked(mockDmk.stopDiscovering).mockResolvedValue(undefined);
      vi.mocked(mockDmk.connect).mockResolvedValue(
        mockConnectedDevice.sessionId,
      );
      vi.mocked(mockDmk.getConnectedDevice).mockResolvedValue(
        mockConnectedDevice,
      );
    });

    it("should connect to USB device successfully", async () => {
      const device = await service.connectToDevice({ type: "usb" });

      expect(device).toBeDefined();
      expect(mockDmk.startDiscovering).toHaveBeenCalledWith({
        transport: service.hidIdentifier,
      });
      expect(device.name).toBe(mockConnectedDevice.name);
      expect(device.modelId).toBe(mockConnectedDevice.modelId);
    });

    it("should connect to Bluetooth device successfully", async () => {
      const device = await service.connectToDevice({ type: "bluetooth" });

      expect(device).toBeDefined();
      expect(mockDmk.startDiscovering).toHaveBeenCalledWith({
        transport: service.bleIdentifier,
      });
    });

    it("should use BLE identifier for non-usb connection type", async () => {
      const device = await service.connectToDevice({ type: "" });

      expect(device).toBeDefined();
      expect(mockDmk.startDiscovering).toHaveBeenCalledWith({
        transport: service.bleIdentifier,
      });
    });

    it("should stop discovering after device is found", async () => {
      await service.connectToDevice({ type: "usb" });

      expect(mockDmk.stopDiscovering).toHaveBeenCalled();
    });

    it("should set connected device after connection", async () => {
      await service.connectToDevice({ type: "usb" });

      expect(service.connectedDevice).toBeDefined();
      expect(service.sessionId).toBe(mockConnectedDevice.sessionId);
      expect(service.connectedDevice?.name).toBe(mockConnectedDevice.name);
    });

    it("should throw DeviceConnectionError when no accessible device", async () => {
      const noDeviceError = new NoAccessibleDeviceError("No device found");
      vi.mocked(mockDmk.startDiscovering).mockReturnValue(
        throwError(() => noDeviceError) as Observable<DiscoveredDevice>,
      );

      await expect(service.connectToDevice({ type: "usb" })).rejects.toThrow(
        DeviceConnectionError,
      );

      await expect(service.connectToDevice({ type: "usb" })).rejects.toThrow(
        "No accessible device",
      );
    });

    it("should throw DeviceConnectionError when discovery fails", async () => {
      const error = new Error("Discovery failed");
      vi.mocked(mockDmk.startDiscovering).mockReturnValue(
        throwError(() => error) as Observable<DiscoveredDevice>,
      );

      await expect(service.connectToDevice({ type: "usb" })).rejects.toThrow(
        DeviceConnectionError,
      );

      await expect(service.connectToDevice({ type: "usb" })).rejects.toThrow(
        "Failed to start discovery",
      );
    });

    it("should throw DeviceConnectionError when connection fails", async () => {
      vi.mocked(mockDmk.connect).mockRejectedValue(
        new Error("Connection failed"),
      );

      await expect(service.connectToDevice({ type: "usb" })).rejects.toThrow(
        DeviceConnectionError,
      );

      await expect(service.connectToDevice({ type: "usb" })).rejects.toThrow(
        "Failed to connect to device",
      );
    });

    it("should include error type in DeviceConnectionError for no accessible device", async () => {
      const error = new NoAccessibleDeviceError("No device");
      vi.mocked(mockDmk.startDiscovering).mockReturnValue(
        throwError(() => error) as Observable<DiscoveredDevice>,
      );

      try {
        await service.connectToDevice({ type: "usb" });
        expect.fail("Should have thrown an error");
      } catch (e) {
        expect(e).toBeInstanceOf(DeviceConnectionError);
        expect((e as DeviceConnectionError).context?.type).toBe(
          "no-accessible-device",
        );
        expect((e as DeviceConnectionError).context?.error).toBe(error);
      }
    });

    it("should include error type in DeviceConnectionError for discovery failure", async () => {
      const error = new Error("Discovery failed");
      vi.mocked(mockDmk.startDiscovering).mockReturnValue(
        throwError(() => error) as Observable<DiscoveredDevice>,
      );

      try {
        await service.connectToDevice({ type: "usb" });
        expect.fail("Should have thrown an error");
      } catch (e) {
        expect(e).toBeInstanceOf(DeviceConnectionError);
        expect((e as DeviceConnectionError).context?.type).toBe(
          "failed-to-start-discovery",
        );
        expect((e as DeviceConnectionError).context?.error).toBe(error);
      }
    });

    it("should include error type in DeviceConnectionError for connection failure", async () => {
      const error = new Error("Connection failed");
      vi.mocked(mockDmk.connect).mockRejectedValue(error);

      try {
        await service.connectToDevice({ type: "usb" });
        expect.fail("Should have thrown an error");
      } catch (e) {
        expect(e).toBeInstanceOf(DeviceConnectionError);
        expect((e as DeviceConnectionError).context?.type).toBe(
          "failed-to-connect",
        );
        expect((e as DeviceConnectionError).context?.error).toBe(error);
      }
    });
  });

  describe("disconnectFromDevice", () => {
    it("should disconnect successfully when session exists", async () => {
      vi.mocked(mockDmk.startDiscovering).mockReturnValue(
        of(mockDiscoveredDevice) as Observable<DiscoveredDevice>,
      );
      vi.mocked(mockDmk.stopDiscovering).mockResolvedValue(undefined);
      vi.mocked(mockDmk.connect).mockResolvedValue(
        mockConnectedDevice.sessionId,
      );
      vi.mocked(mockDmk.getConnectedDevice).mockResolvedValue(
        mockConnectedDevice,
      );
      vi.mocked(mockDmk.close).mockResolvedValue(undefined);

      await service.connectToDevice({ type: "usb" });
      await service.disconnectFromDevice();

      expect(mockDmk.close).toHaveBeenCalled();
      expect(service.sessionId).toBeUndefined();
    });

    it("should do nothing when no session exists", async () => {
      vi.mocked(mockDmk.close).mockResolvedValue(undefined);

      await service.disconnectFromDevice();

      expect(mockDmk.close).not.toHaveBeenCalled();
    });

    it("should throw DeviceConnectionError when disconnect fails", async () => {
      vi.mocked(mockDmk.startDiscovering).mockReturnValue(
        of(mockDiscoveredDevice) as Observable<DiscoveredDevice>,
      );
      vi.mocked(mockDmk.stopDiscovering).mockResolvedValue(undefined);
      vi.mocked(mockDmk.connect).mockResolvedValue(
        mockConnectedDevice.sessionId,
      );
      vi.mocked(mockDmk.getConnectedDevice).mockResolvedValue(
        mockConnectedDevice,
      );
      vi.mocked(mockDmk.close).mockRejectedValue(
        new Error("Disconnect failed"),
      );

      await service.connectToDevice({ type: "usb" });

      await expect(service.disconnectFromDevice()).rejects.toThrow(
        DeviceConnectionError,
      );
      await expect(service.disconnectFromDevice()).rejects.toThrow(
        "Failed to disconnect from device",
      );
    });

    it("should include error type in DeviceConnectionError for disconnect failure", async () => {
      vi.mocked(mockDmk.startDiscovering).mockReturnValue(
        of(mockDiscoveredDevice) as Observable<DiscoveredDevice>,
      );
      vi.mocked(mockDmk.stopDiscovering).mockResolvedValue(undefined);
      vi.mocked(mockDmk.connect).mockResolvedValue(
        mockConnectedDevice.sessionId,
      );
      vi.mocked(mockDmk.getConnectedDevice).mockResolvedValue(
        mockConnectedDevice,
      );
      const error = new Error("Disconnect failed");
      vi.mocked(mockDmk.close).mockRejectedValue(error);

      await service.connectToDevice({ type: "usb" });

      try {
        await service.disconnectFromDevice();
        expect.fail("Should have thrown an error");
      } catch (e) {
        expect(e).toBeInstanceOf(DeviceConnectionError);
        expect((e as DeviceConnectionError).context?.type).toBe(
          "failed-to-disconnect",
        );
        expect((e as DeviceConnectionError).context?.error).toBe(error);
      }
    });
  });
});
