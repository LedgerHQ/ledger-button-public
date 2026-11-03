import {
  OutOfMemoryDAError,
  UnsupportedFirmwareDAError,
} from "@ledgerhq/device-management-kit";

import {
  DeviceFirmwareOutdatedError,
  DeviceOutOfMemoryError,
} from "@api/errors/DeviceErrors";

/**
 * Maps DMK open-app / install-plan errors to domain errors the UI can display.
 * Unrecognized errors are returned unchanged.
 */
export function mapOpenAppDeviceActionError(
  error: unknown,
  appName: string,
): unknown {
  if (error instanceof OutOfMemoryDAError) {
    return new DeviceOutOfMemoryError(
      "Not enough memory on device to process the request",
      { appName },
    );
  }

  if (error instanceof UnsupportedFirmwareDAError) {
    return new DeviceFirmwareOutdatedError(
      "Device firmware is too old to install or update the required application",
      { appName },
    );
  }

  return error;
}
