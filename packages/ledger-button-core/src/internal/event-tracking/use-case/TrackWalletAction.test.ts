import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/service/ContextService";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import type { EventTrackingService } from "../service/EventTrackingService";
import { TrackWalletAction } from "./TrackWalletAction";

describe("TrackWalletAction", () => {
  let eventTrackingService: EventTrackingService;
  let trustChainId: string | undefined;
  let useCase: TrackWalletAction;

  beforeEach(() => {
    trustChainId = "trust-chain";
    eventTrackingService = {
      getSessionId: vi.fn().mockReturnValue("session-id"),
      trackEvent: vi.fn().mockResolvedValue(undefined),
    };
    const logger = { debug: vi.fn() } as unknown as LoggerPublisher;
    const contextService = {
      getContext: vi.fn(() => ({ trustChainId })),
    } as unknown as ContextService;

    useCase = new TrackWalletAction(
      () => logger,
      eventTrackingService,
      { dAppIdentifier: "test-dapp" } as Config,
      contextService,
    );
  });

  it.each([
    ["trackWalletActionClicked", "wallet_action_clicked"],
    ["trackWalletRedirectConfirmed", "wallet_redirect_confirmed"],
    ["trackWalletRedirectCancelled", "wallet_redirect_cancelled"],
  ] as const)(
    "%s sends %s with the session and trust chain ids",
    async (method, eventType) => {
      await useCase[method]("send");

      expect(eventTrackingService.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event_type: eventType,
            session_id: "session-id",
            ledger_sync_user_id: "trust-chain",
            wallet_action: "send",
          }),
        }),
      );
    },
  );

  it("omits ledger_sync_user_id when there is no trust chain id", async () => {
    trustChainId = undefined;

    await useCase.trackWalletActionClicked("swap");

    const [event] = vi.mocked(eventTrackingService.trackEvent).mock.calls[0];
    expect(JSON.parse(JSON.stringify(event.data))).not.toHaveProperty(
      "ledger_sync_user_id",
    );
  });
});
