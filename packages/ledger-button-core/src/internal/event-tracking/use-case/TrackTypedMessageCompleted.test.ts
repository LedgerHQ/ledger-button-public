import { Just } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import type { Account } from "@api/model/Account";
import { aCurrencyDescriptor } from "@internal/blockchain-provider/__mocks__/currencyDescriptorMock";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";
import type { Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/ContextService";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import type { EventTrackingService } from "../service/EventTrackingService";
import { TrackTypedMessageCompleted } from "./TrackTypedMessageCompleted";

const polygonAccount: Account = {
  id: "acc-pol",
  currencyId: "polygon",
  freshAddress: "0xPolygonAddress",
  seedIdentifier: "seed",
  derivationMode: "default",
  index: 0,
  name: "Polygon Account",
  ticker: "POL",
  balance: "1.0",
  tokens: [],
};

describe("TrackTypedMessageCompleted", () => {
  let mockEventTrackingService: EventTrackingService;
  let mockBlockchainProviderManager: BlockchainProviderManager;
  let useCase: TrackTypedMessageCompleted;

  beforeEach(() => {
    mockEventTrackingService = {
      getSessionId: vi.fn().mockReturnValue("session-id"),
      trackEvent: vi.fn().mockResolvedValue(undefined),
    };

    mockBlockchainProviderManager = {
      describeCurrency: vi.fn(),
    } as unknown as BlockchainProviderManager;

    useCase = new TrackTypedMessageCompleted(
      () =>
        ({
          debug: vi.fn(),
        }) as unknown as LoggerPublisher,
      mockEventTrackingService,
      { dAppIdentifier: "test-dapp" } as Config,
      {
        getContext: vi.fn().mockReturnValue({
          trustChainId: "trust-chain",
          chainId: 1,
          selectedAccounts: new Map<BlockchainFamily, Account>([
            ["ethereum", polygonAccount],
          ]),
        }),
      } as unknown as ContextService,
      mockBlockchainProviderManager,
    );
  });

  it("sends the network of the selected EVM account, not context.chainId", async () => {
    vi.mocked(mockBlockchainProviderManager.describeCurrency).mockReturnValue(
      Just(aCurrencyDescriptor({ currencyId: "polygon", networkId: "137" })),
    );

    await useCase.execute({ types: {}, domain: {}, message: {} });

    expect(mockBlockchainProviderManager.describeCurrency).toHaveBeenCalledWith(
      "polygon",
    );
    expect(mockEventTrackingService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          event_type: "typed_message_flow_completion",
          blockchain_network_selected: "ethereum",
          chain_id: "137",
        }),
      }),
    );
  });
});
