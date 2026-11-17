import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeviceDisconnectedError } from "@api/errors/DeviceErrors";
import type { Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/service/ContextService";
import { LedgerSyncConnectionFailedError } from "@internal/ledgersync/model/errors";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import type { EventTrackingService } from "../service/EventTrackingService";
import { TrackDeviceConnectionUseCase } from "./TrackDeviceConnectionUseCase";

const SESSION_ID = "a93f987c-11df-40d7-abe7-cfd2c7be92a2";

describe("TrackDeviceConnectionUseCase", () => {
  let mockEventTrackingService: EventTrackingService;
  let mockContextService: ContextService;
  let useCase: TrackDeviceConnectionUseCase;

  const trackedData = () =>
    vi.mocked(mockEventTrackingService.trackEvent).mock.calls[0][0].data;

  beforeEach(() => {
    const mockLogger = { debug: vi.fn() } as unknown as LoggerPublisher;

    mockEventTrackingService = {
      getSessionId: vi.fn().mockReturnValue(SESSION_ID),
      trackEvent: vi.fn().mockResolvedValue(undefined),
    };

    mockContextService = {
      getContext: vi.fn().mockReturnValue({ trustChainId: undefined }),
    } as unknown as ContextService;

    useCase = new TrackDeviceConnectionUseCase(
      () => mockLogger,
      mockEventTrackingService,
      { dAppIdentifier: "test-dapp" } as Config,
      mockContextService,
    );
  });

  it.each(["selected", "succeeded"] as const)(
    "tracks device_connection_%s",
    async (status) => {
      await useCase.execute({ status, connectionType: "usb" });

      expect(mockEventTrackingService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: `device_connection_${status}` }),
      );
      expect(trackedData()).toMatchObject({
        event_type: `device_connection_${status}`,
        transaction_dapp_id: "test-dapp",
        session_id: SESSION_ID,
        connection_type: "usb",
      });
    },
  );

  it("sets ledger_sync_user_id from the trust chain id", async () => {
    vi.mocked(mockContextService.getContext).mockReturnValue({
      trustChainId: "trust-chain-id",
    } as ReturnType<ContextService["getContext"]>);

    await useCase.execute({ status: "selected", connectionType: "bluetooth" });

    expect(trackedData()).toMatchObject({
      ledger_sync_user_id: "trust-chain-id",
    });
  });

  it("tracks a device failure with its error type", async () => {
    await useCase.execute({
      status: "failed",
      connectionType: "bluetooth",
      error: new DeviceDisconnectedError("disconnected"),
    });

    expect(trackedData()).toMatchObject({
      event_type: "device_connection_failed",
      connection_type: "bluetooth",
      error_type: "DeviceDisconnectedError",
      error_category: "device",
    });
  });

  it("categorizes a Ledger Sync failure as ledgersync", async () => {
    await useCase.execute({
      status: "failed",
      connectionType: "usb",
      error: new LedgerSyncConnectionFailedError("sync failed"),
    });

    expect(trackedData()).toMatchObject({
      error_type: "LedgerSyncConnectionFailedError",
      error_category: "ledgersync",
    });
  });

  it.each([
    ["an unmapped error", new TypeError("boom"), "TypeError"],
    ["a non-Error value", "boom", "Error"],
  ])("falls back to the device category for %s", async (_, error, type) => {
    await useCase.execute({ status: "failed", connectionType: "usb", error });

    expect(trackedData()).toMatchObject({
      error_type: type,
      error_category: "device",
    });
  });
});
