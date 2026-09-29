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
import { TrackTransactionCompleted } from "./TrackTransactionCompleted";

const solanaAccount: Account = {
  id: "acc-sol",
  currencyId: "solana",
  freshAddress: "SoLAddress",
  seedIdentifier: "seed",
  derivationMode: "default",
  index: 0,
  name: "Solana Account",
  ticker: "SOL",
  balance: "1.0",
  tokens: [],
};

describe("TrackTransactionCompleted", () => {
  let mockEventTrackingService: EventTrackingService;
  let mockBlockchainProviderManager: BlockchainProviderManager;
  let useCase: TrackTransactionCompleted;

  beforeEach(() => {
    mockEventTrackingService = {
      getSessionId: vi.fn().mockReturnValue("session-id"),
      trackEvent: vi.fn().mockResolvedValue(undefined),
    };

    mockBlockchainProviderManager = {
      describeCurrency: vi.fn(),
    } as unknown as BlockchainProviderManager;

    useCase = new TrackTransactionCompleted(
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
            ["solana", solanaAccount],
          ]),
        }),
      } as unknown as ContextService,
      mockBlockchainProviderManager,
    );
  });

  it("sends a transaction flow completion event for the ethereum family", async () => {
    await useCase.execute("ethereum");

    expect(mockEventTrackingService.trackEvent).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        data: expect.objectContaining({
          event_type: "transaction_flow_completion",
          blockchain_network_selected: "ethereum",
          chain_id: "1",
        }),
      }),
    );
  });

  it("sends a transaction flow completion event for the solana family", async () => {
    vi.mocked(mockBlockchainProviderManager.describeCurrency).mockReturnValue(
      Just(
        aCurrencyDescriptor({
          currencyId: "solana",
          family: "solana",
          networkId: "mainnet",
        }),
      ),
    );

    await useCase.execute("solana");

    expect(mockEventTrackingService.trackEvent).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        data: expect.objectContaining({
          event_type: "transaction_flow_completion",
          blockchain_network_selected: "solana",
          chain_id: "mainnet",
        }),
      }),
    );
  });
});
