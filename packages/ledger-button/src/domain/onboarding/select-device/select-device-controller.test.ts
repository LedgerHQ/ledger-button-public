import {
  DeviceConnectionError,
  DeviceDisconnectedError,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreContext } from "../../../context/core-context";
import type { LanguageContext } from "../../../context/language-context";
import { SelectDeviceController } from "./select-device-controller";

describe("SelectDeviceController", () => {
  let host: ReactiveControllerHost;
  let core: CoreContext;
  let controller: SelectDeviceController;

  beforeEach(() => {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };
    core = {
      connectToDevice: vi.fn(),
    } as unknown as CoreContext;
    const lang = {
      currentTranslation: {
        error: {
          connection: {
            DeviceDisconnected: {
              title: "Your Ledger device is disconnected",
              description: "Reconnect your Ledger device.",
              cta1: "Reconnect Ledger device",
            },
          },
        },
      },
    } as unknown as LanguageContext;

    controller = new SelectDeviceController(host, core, lang);
  });

  it("shows a reconnect error when discovery fails", async () => {
    vi.mocked(core.connectToDevice).mockRejectedValue(
      new DeviceConnectionError("Failed to start discovery", {
        type: "failed-to-start-discovery",
        error: new Error("stale session"),
      }),
    );

    await controller.connectToDevice({
      title: "USB",
      connectionType: "usb",
      timestamp: 1,
    });

    expect(controller.errorData).toEqual(
      expect.objectContaining({
        title: "Your Ledger device is disconnected",
        message: "Reconnect your Ledger device.",
      }),
    );
  });

  it("shows a reconnect error when releasing the previous session fails", async () => {
    vi.mocked(core.connectToDevice).mockRejectedValue(
      new DeviceConnectionError("Failed to disconnect from device", {
        type: "failed-to-disconnect",
        error: new Error("no matching device connection found"),
      }),
    );

    await controller.connectToDevice({
      title: "USB",
      connectionType: "usb",
      timestamp: 1,
    });

    expect(controller.errorData).toEqual(
      expect.objectContaining({
        title: "Your Ledger device is disconnected",
      }),
    );
  });

  it("keeps device-picker cancellation silent", async () => {
    vi.mocked(core.connectToDevice).mockRejectedValue(
      new DeviceConnectionError("No accessible device", {
        type: "no-accessible-device",
        error: new Error("picker closed"),
      }),
    );

    await controller.connectToDevice({
      title: "USB",
      connectionType: "usb",
      timestamp: 1,
    });

    expect(controller.errorData).toBeUndefined();
  });

  it("shows a reconnect error when the device is already disconnected", async () => {
    vi.mocked(core.connectToDevice).mockRejectedValue(
      new DeviceDisconnectedError("Device disconnected during signing"),
    );

    await controller.connectToDevice({
      title: "USB",
      connectionType: "usb",
      timestamp: 1,
    });

    expect(controller.errorData).toEqual(
      expect.objectContaining({
        title: "Your Ledger device is disconnected",
        message: "Reconnect your Ledger device.",
      }),
    );
  });
});
