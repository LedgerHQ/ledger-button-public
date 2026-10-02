import { describe, expect, it } from "vitest";

import { DeviceDisconnectedError } from "@api/errors/DeviceErrors";
import type { SignFlowStatus } from "@api/model/signing/SignFlowStatus";

import {
  normalizeDeviceError,
  normalizeSignFlowStatusError,
} from "./normalizeDeviceError";

describe("normalizeDeviceError", () => {
  it.each([
    "DeviceDisconnectedWhileSendingError",
    "DeviceDisconnectedBeforeSendingApdu",
    "ReconnectionFailedError",
  ])("translates the DMK %s tag into a DeviceDisconnectedError", (tag) => {
    const normalized = normalizeDeviceError({ _tag: tag });

    expect(normalized).toBeInstanceOf(DeviceDisconnectedError);
  });

  it("leaves an unrelated DMK error untouched", () => {
    const error = { _tag: "SendApduTimeoutError" };

    expect(normalizeDeviceError(error)).toBe(error);
  });

  it("leaves a plain error untouched", () => {
    const error = new Error("boom");

    expect(normalizeDeviceError(error)).toBe(error);
  });

  it("returns an already normalized error as-is", () => {
    const error = new DeviceDisconnectedError("Device disconnected");

    expect(normalizeDeviceError(error)).toBe(error);
  });

  it.each([undefined, null, "a string"])(
    "tolerates the non-object error %s",
    (error) => {
      expect(normalizeDeviceError(error)).toBe(error);
    },
  );
});

describe("normalizeSignFlowStatusError", () => {
  it("translates the error carried by an error status", () => {
    const normalized = normalizeSignFlowStatusError({
      signType: "transaction",
      status: "error",
      error: { _tag: "DeviceDisconnectedWhileSendingError" },
    });

    expect(normalized.status).toBe("error");
    expect(
      (normalized as { error: unknown }).error,
    ).toBeInstanceOf(DeviceDisconnectedError);
  });

  it("returns the same object when the error needs no translation", () => {
    const status: SignFlowStatus = {
      signType: "transaction",
      status: "error",
      error: new Error("boom"),
    };

    expect(normalizeSignFlowStatusError(status)).toBe(status);
  });

  it("returns the same object for a non-error status", () => {
    const status: SignFlowStatus = {
      signType: "transaction",
      status: "user-interaction-needed",
      interaction: "unlock-device",
    };

    expect(normalizeSignFlowStatusError(status)).toBe(status);
  });
});
