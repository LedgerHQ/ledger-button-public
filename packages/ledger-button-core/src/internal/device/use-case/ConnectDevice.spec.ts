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

  const mockNanoSDevice = new Device({
    name: "Nano S",
    modelId: DeviceModelId.NANO_S,
    sessionId: "session-789",
    type: "USB",
    id: "device-3",
  } as ConnectedDevice);

  beforeEach(() => {
    mockDeviceManagementKitService = {
      connectToDevice: vi.fn(),
      disconnectFromDevice: vi.fn(),
      listAvailableDevices: vi.fn(),
      dmk: {},
    };

    connectDevice = new ConnectDevice(
      () => ({
        subscribers: [],
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        fatal: vi.fn(),
      }),
      mockDeviceManagementKitService as unknown as DeviceManagementKitService,
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    describe("successful device connection", () => {
      it.each([
        { type: "usb" as const, device: mockUsbDevice, name: "USB" },
        {
          type: "bluetooth" as const,
          device: mockBleDevice,
          name: "Bluetooth",
        },
      ])(
        "should connect to $name device successfully",
        async ({ type, device }) => {
          mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
            device,
          );

          const result = await connectDevice.execute({ type });

          expect(result).toBe(device);
          expect(
            mockDeviceManagementKitService.connectToDevice,
          ).toHaveBeenCalledWith({ type });
        },
      );
    });

    describe("NANO_S device rejection", () => {
      beforeEach(() => {
        mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
          mockNanoSDevice,
        );
        mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
          undefined,
        );
      });

      it("should throw DeviceNotSupportedError for NANO_S device", async () => {
        try {
          await connectDevice.execute({ type: "usb" });
        } catch (error) {
          expect(error).toBeInstanceOf(DeviceNotSupportedError);
          expect((error as DeviceNotSupportedError).context?.modelId).toBe(
            DeviceModelId.NANO_S,
          );
        }
      });
    });
  });
});
