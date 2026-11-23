import { beforeEach, describe, expect, it, vi } from "vitest";

import { LedgerSyncAuthenticationError } from "@api/model/errors";
import type { Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/service/ContextService";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import type { EventTrackingService } from "../service/EventTrackingService";
import { TrackLedgerSyncFailedUseCase } from "./TrackLedgerSyncFailedUseCase";

const SESSION_ID = "a93f987c-11df-40d7-abe7-cfd2c7be92a2";

describe("TrackLedgerSyncFailedUseCase", () => {
  let mockEventTrackingService: EventTrackingService;
  let mockContextService: ContextService;
  let useCase: TrackLedgerSyncFailedUseCase;

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

    useCase = new TrackLedgerSyncFailedUseCase(
      () => mockLogger,
      mockEventTrackingService,
      { dAppIdentifier: "test-dapp" } as Config,
      mockContextService,
    );
  });

  it("tracks ledger_sync_failed with its failure reason", async () => {
    await useCase.execute(
      new LedgerSyncAuthenticationError("refused", {
        cause: { _tag: "Error", errorCode: "6985" },
      }),
    );

    expect(mockEventTrackingService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ledger_sync_failed" }),
    );
    expect(trackedData()).toEqual(
      expect.objectContaining({
        event_type: "ledger_sync_failed",
        transaction_dapp_id: "test-dapp",
        session_id: SESSION_ID,
        failure_reason: "user_rejected",
      }),
    );
    expect(trackedData()).not.toHaveProperty("error_type", expect.anything());
  });

  it("sets ledger_sync_user_id from the trust chain id", async () => {
    vi.mocked(mockContextService.getContext).mockReturnValue({
      trustChainId: "trust-chain-id",
    } as ReturnType<ContextService["getContext"]>);

    await useCase.execute(new Error("boom"));

    expect(trackedData()).toMatchObject({
      ledger_sync_user_id: "trust-chain-id",
      failure_reason: "unknown",
      error_type: "Error",
    });
  });
});
