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
    it("should initialize with no session ID and no connected cevice", () => {
      expect(service.dmk).toBeDefined();
      expect(service.sessionId).toBeUndefined();
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

    it.each([
      {
        type: "usb" as const,
        transport: "hidIdentifier" as const,
      },
      {
        type: "bluetooth" as const,
        transport: "bleIdentifier" as const,
      },
    ])(
      "should connect to $type device successfully",
      async ({ type, transport }) => {
        const device = await service.connectToDevice({ type });

        expect(device).toBeDefined();
        expect(mockDmk.startDiscovering).toHaveBeenCalledWith({
          transport: service[transport],
        });
        expect(service.connectedDevice).toBeDefined();
        expect(service.sessionId).toBe(mockConnectedDevice.sessionId);
        expect(service.connectedDevice?.name).toBe(mockConnectedDevice.name);
      },
    );

    it("should throw DeviceConnectionError when no accessible device", async () => {
      const noDeviceError = new NoAccessibleDeviceError("No device found");
      vi.mocked(mockDmk.startDiscovering).mockReturnValue(
        throwError(() => noDeviceError) as Observable<DiscoveredDevice>,
      );

      await expect(service.connectToDevice({ type: "usb" })).rejects.toThrow(
        DeviceConnectionError,
      );
    });

    it("should throw DeviceConnectionError when connection fails", async () => {
      vi.mocked(mockDmk.connect).mockRejectedValue(
        new Error("Connection failed"),
      );

      await expect(service.connectToDevice({ type: "usb" })).rejects.toThrow(
        DeviceConnectionError,
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
    });
  });
});
