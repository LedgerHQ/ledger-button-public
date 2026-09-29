import {
  OutOfMemoryDAError,
  UnsupportedFirmwareDAError,
} from "@ledgerhq/device-management-kit";
import { describe, expect, it } from "vitest";

import {
  DeviceFirmwareOutdatedError,
  DeviceOutOfMemoryError,
} from "@api/errors/DeviceErrors";

import { mapOpenAppDeviceActionError } from "./mapOpenAppDeviceActionError";

const APP_NAME = "Solana";

describe("mapOpenAppDeviceActionError", () => {
  it("maps OutOfMemoryDAError to DeviceOutOfMemoryError", () => {
    const mapped = mapOpenAppDeviceActionError(
      new OutOfMemoryDAError("full"),
      APP_NAME,
    );

    expect(mapped).toBeInstanceOf(DeviceOutOfMemoryError);
    expect(mapped).toMatchObject({
      name: "DeviceOutOfMemoryError",
      context: { appName: APP_NAME },
    });
  });

  it("maps UnsupportedFirmwareDAError to DeviceFirmwareOutdatedError", () => {
    const mapped = mapOpenAppDeviceActionError(
      new UnsupportedFirmwareDAError("Application Solana needs latest firmware"),
      APP_NAME,
    );

    expect(mapped).toBeInstanceOf(DeviceFirmwareOutdatedError);
    expect(mapped).toMatchObject({
      name: "DeviceFirmwareOutdatedError",
      context: { appName: APP_NAME },
    });
  });

  it("returns any other error unchanged", () => {
    const original = new Error("other");
    expect(mapOpenAppDeviceActionError(original, APP_NAME)).toBe(original);
  });
});
