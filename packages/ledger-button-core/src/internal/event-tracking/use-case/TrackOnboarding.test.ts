import { Just, Nothing } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Account } from "@api/model/Account";
import { aCurrencyDescriptor } from "@internal/blockchain-provider/__mocks__/currencyDescriptorMock";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";
import type { Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/ContextService";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import type { EventTrackingService } from "../service/EventTrackingService";
import { TrackOnboarding } from "./TrackOnboarding";

const selectedAccount: Account = {
  id: "acc-1",
  currencyId: "ethereum",
  freshAddress: "0x00",
  seedIdentifier: "seed",
  derivationMode: "default",
  index: 0,
  name: "Account",
  ticker: "ETH",
  balance: "1.0",
  tokens: [],
};

describe("TrackOnboarding", () => {
  let mockLogger: LoggerPublisher;
  let mockEventTrackingService: EventTrackingService;
  let mockConfig: Config;
  let mockContextService: ContextService;
  let mockBlockchainProviderManager: BlockchainProviderManager;
  let useCase: TrackOnboarding;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      fatal: vi.fn(),
      subscribers: [],
    } as unknown as LoggerPublisher;

    mockEventTrackingService = {
      getSessionId: vi.fn().mockReturnValue("session-id"),
      trackEvent: vi.fn().mockResolvedValue(undefined),
    };

    mockConfig = {
      dAppIdentifier: "test-dapp",
    } as Config;

    mockContextService = {
      getContext: vi.fn().mockReturnValue({ trustChainId: "trust-chain" }),
    } as unknown as ContextService;

    mockBlockchainProviderManager = {
      describeCurrency: vi.fn(),
    } as unknown as BlockchainProviderManager;

    useCase = new TrackOnboarding(
      () => mockLogger,
      mockEventTrackingService,
      mockConfig,
      mockContextService,
      mockBlockchainProviderManager,
    );
  });

  it("sends the resolved network id as chain_id", async () => {
    vi.mocked(mockBlockchainProviderManager.describeCurrency).mockReturnValue(
      Just(aCurrencyDescriptor({ networkId: "137" })),
    );

    await useCase.execute(selectedAccount);

    expect(mockEventTrackingService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ chain_id: "137" }),
      }),
    );
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it("sends null chain_id and warns when the currency is unmapped", async () => {
    vi.mocked(mockBlockchainProviderManager.describeCurrency).mockReturnValue(
      Nothing,
    );

    await useCase.execute({ ...selectedAccount, currencyId: "bitcoin" });

    expect(mockEventTrackingService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ chain_id: null }),
      }),
    );
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "No currency descriptor for onboarding chain_id",
      { currencyId: "bitcoin" },
    );
  });
});
