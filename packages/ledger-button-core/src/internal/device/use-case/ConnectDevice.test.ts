import {
  DeviceModelId,
  DmkResultStatus,
} from "@ledgerhq/device-management-kit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DeviceNotSupportedError,
} from "@api/errors/DeviceErrors";

import {
  asMockService,
  createMockDeviceManagementKitService,
  createMockLoggerFactory,
  mockNanoSDevice,
  mockUsbDevice,
} from "../__tests__/mocks";
import { ConnectDevice } from "./ConnectDevice";

function mockOnboardedOsVersionResult(isOnboarded: boolean) {
  return {
    status: DmkResultStatus.Success,
    data: {
      secureElementFlags: { isOnboarded },
    },
  };
}

describe("ConnectDevice", () => {
  let connectDevice: ConnectDevice;
  let mockDeviceManagementKitService: ReturnType<
    typeof createMockDeviceManagementKitService
  >;

  beforeEach(() => {
    mockDeviceManagementKitService = createMockDeviceManagementKitService();

    connectDevice = new ConnectDevice(
      createMockLoggerFactory(),
      asMockService(mockDeviceManagementKitService),
    );

    vi.clearAllMocks();
  });

  describe("execute", () => {
    describe("successful device connection", () => {
      it("should connect to USB device successfully when device is onboarded", async () => {
        const type = "usb" as const;
        mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
          mockUsbDevice,
        );
        mockDeviceManagementKitService.dmk.sendCommand.mockResolvedValue(
          mockOnboardedOsVersionResult(true),
        );

        const result = await connectDevice.execute({ type });

        expect(result).toBe(mockUsbDevice);
        expect(
          mockDeviceManagementKitService.connectToDevice,
        ).toHaveBeenCalledWith({ type });
        expect(
          mockDeviceManagementKitService.dmk.sendCommand,
        ).toHaveBeenCalledWith({
          sessionId: mockUsbDevice.sessionId,
          command: expect.objectContaining({ name: "getOsVersion" }),
        });
      });

      it("should allow connect when GetOsVersionCommand fails", async () => {
        const type = "usb" as const;
        mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
          mockUsbDevice,
        );
        mockDeviceManagementKitService.dmk.sendCommand.mockResolvedValue({
          status: DmkResultStatus.Error,
          error: new Error("Command failed"),
        });

        const result = await connectDevice.execute({ type });

        expect(result).toBe(mockUsbDevice);
        expect(
          mockDeviceManagementKitService.disconnectFromDevice,
        ).not.toHaveBeenCalled();
      });
    });

    describe("device not onboarded rejection", () => {
      beforeEach(() => {
        mockDeviceManagementKitService.connectToDevice.mockResolvedValue(
          mockUsbDevice,
        );
        mockDeviceManagementKitService.dmk.sendCommand.mockResolvedValue(
          mockOnboardedOsVersionResult(false),
        );
        mockDeviceManagementKitService.disconnectFromDevice.mockResolvedValue(
          undefined,
        );
      });

      it("should throw DeviceNotOnboardedError and disconnect when device is not onboarded", async () => {
        await expect(connectDevice.execute({ type: "usb" })).rejects.toMatchObject(
          {
            name: "DeviceNotOnboardedError",
            context: { modelId: DeviceModelId.NANO_X },
          },
        );
        expect(
          mockDeviceManagementKitService.disconnectFromDevice,
        ).toHaveBeenCalled();
      });
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
        expect(
          mockDeviceManagementKitService.dmk.sendCommand,
        ).not.toHaveBeenCalled();
      });
    });
  });
});
