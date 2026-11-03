import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/service/ContextService";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import type { EventTrackingService } from "../service/EventTrackingService";
import { TrackConsentGivenUseCase } from "./TrackConsentGivenUseCase";
import { TrackConsentRemovedUseCase } from "./TrackConsentRemovedUseCase";
import { TrackCurrencyChangedUseCase } from "./TrackCurrencyChangedUseCase";
import { TrackFloatingButtonClickUseCase } from "./TrackFloatingButtonClickUseCase";
import { TrackLanguageChangedUseCase } from "./TrackLanguageChangedUseCase";
import { TrackLedgerSyncActivatedUseCase } from "./TrackLedgerSyncActivatedUseCase";
import { TrackLedgerSyncOpenedUseCase } from "./TrackLedgerSyncOpenedUseCase";
import { TrackMobileRedirectLedgerWalletUseCase } from "./TrackMobileRedirectLedgerWalletUseCase";
import { TrackOpenSessionUseCase } from "./TrackOpenSessionUseCase";

describe("Track use cases that send a single event", () => {
  let logger: LoggerPublisher;
  let eventTrackingService: EventTrackingService;
  let config: Config;
  let contextService: ContextService;

  beforeEach(() => {
    logger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      fatal: vi.fn(),
      subscribers: [],
    } as unknown as LoggerPublisher;
    eventTrackingService = {
      getSessionId: vi.fn().mockReturnValue("session-id"),
      trackEvent: vi.fn().mockResolvedValue(undefined),
    };
    config = { dAppIdentifier: "test-dapp" } as Config;
    contextService = {
      getContext: vi.fn().mockReturnValue({ trustChainId: "trust-chain" }),
    } as unknown as ContextService;
  });

  const loggerFactory = () => logger;

  const cases: [string, () => { execute: () => Promise<void> }][] = [
    [
      "TrackConsentGivenUseCase",
      () =>
        new TrackConsentGivenUseCase(
          loggerFactory,
          eventTrackingService,
          config,
        ),
    ],
    [
      "TrackConsentRemovedUseCase",
      () =>
        new TrackConsentRemovedUseCase(
          loggerFactory,
          eventTrackingService,
          config,
          contextService,
        ),
    ],
    [
      "TrackCurrencyChangedUseCase",
      () => {
        const useCase = new TrackCurrencyChangedUseCase(
          loggerFactory,
          eventTrackingService,
          config,
        );
        return { execute: () => useCase.execute("EUR") };
      },
    ],
    [
      "TrackFloatingButtonClickUseCase",
      () =>
        new TrackFloatingButtonClickUseCase(
          loggerFactory,
          eventTrackingService,
          config,
        ),
    ],
    [
      "TrackLanguageChangedUseCase",
      () => {
        const useCase = new TrackLanguageChangedUseCase(
          loggerFactory,
          eventTrackingService,
          config,
        );
        return { execute: () => useCase.execute("fr") };
      },
    ],
    [
      "TrackLedgerSyncActivatedUseCase",
      () =>
        new TrackLedgerSyncActivatedUseCase(
          loggerFactory,
          eventTrackingService,
          config,
          contextService,
        ),
    ],
    [
      "TrackLedgerSyncOpenedUseCase",
      () =>
        new TrackLedgerSyncOpenedUseCase(
          loggerFactory,
          eventTrackingService,
          config,
        ),
    ],
    [
      "TrackMobileRedirectLedgerWalletUseCase",
      () =>
        new TrackMobileRedirectLedgerWalletUseCase(
          loggerFactory,
          eventTrackingService,
          config,
        ),
    ],
    [
      "TrackOpenSessionUseCase",
      () =>
        new TrackOpenSessionUseCase(
          loggerFactory,
          eventTrackingService,
          config,
        ),
    ],
  ];

  it.each(cases)("%s sends one event for the dApp", async (_name, build) => {
    await build().execute();

    expect(eventTrackingService.trackEvent).toHaveBeenCalledTimes(1);
    expect(eventTrackingService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ transaction_dapp_id: "test-dapp" }),
      }),
    );
  });
});
