import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/service/ContextService";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import type { EventTrackingService } from "../service/EventTrackingService";
import { TrackDeviceConnectionSelectedUseCase } from "./TrackDeviceConnectionSelectedUseCase";

const SESSION_ID = "a93f987c-11df-40d7-abe7-cfd2c7be92a2";

describe("TrackDeviceConnectionSelectedUseCase", () => {
  let mockEventTrackingService: EventTrackingService;
  let mockContextService: ContextService;
  let useCase: TrackDeviceConnectionSelectedUseCase;

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

    useCase = new TrackDeviceConnectionSelectedUseCase(
      () => mockLogger,
      mockEventTrackingService,
      { dAppIdentifier: "test-dapp" } as Config,
      mockContextService,
    );
  });

  it.each(["bluetooth", "usb"] as const)(
    "tracks device_connection_selected for %s",
    async (connectionType) => {
      await useCase.execute(connectionType);

      expect(mockEventTrackingService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: "device_connection_selected" }),
      );
      expect(trackedData()).toMatchObject({
        event_type: "device_connection_selected",
        transaction_dapp_id: "test-dapp",
        session_id: SESSION_ID,
        connection_type: connectionType,
      });
    },
  );

  it("sets ledger_sync_user_id from the trust chain id", async () => {
    vi.mocked(mockContextService.getContext).mockReturnValue({
      trustChainId: "trust-chain-id",
    } as ReturnType<ContextService["getContext"]>);

    await useCase.execute("bluetooth");

    expect(trackedData()).toMatchObject({
      ledger_sync_user_id: "trust-chain-id",
    });
  });
});
