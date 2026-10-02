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
import { TrackTransactionStarted } from "./TrackTransactionStarted";

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

describe("TrackTransactionStarted", () => {
  let mockEventTrackingService: EventTrackingService;
  let mockContextService: ContextService;
  let mockBlockchainProviderManager: BlockchainProviderManager;
  let useCase: TrackTransactionStarted;

  beforeEach(() => {
    mockEventTrackingService = {
      getSessionId: vi.fn().mockReturnValue("session-id"),
      trackEvent: vi.fn().mockResolvedValue(undefined),
    };

    mockContextService = {
      getContext: vi.fn().mockReturnValue({
        trustChainId: "trust-chain",
        selectedAccounts: new Map<BlockchainFamily, Account>([
          ["ethereum", polygonAccount],
          ["solana", solanaAccount],
        ]),
      }),
    } as unknown as ContextService;

    mockBlockchainProviderManager = {
      describeCurrency: vi.fn(),
    } as unknown as BlockchainProviderManager;

    useCase = new TrackTransactionStarted(
      () =>
        ({
          debug: vi.fn(),
        }) as unknown as LoggerPublisher,
      mockEventTrackingService,
      { dAppIdentifier: "test-dapp" } as Config,
      mockContextService,
      mockBlockchainProviderManager,
    );
  });

  it("sends the ethereum family with the network of the selected EVM account", async () => {
    vi.mocked(mockBlockchainProviderManager.describeCurrency).mockReturnValue(
      Just(aCurrencyDescriptor({ currencyId: "polygon", networkId: "137" })),
    );

    await useCase.execute("ethereum");

    expect(mockBlockchainProviderManager.describeCurrency).toHaveBeenCalledWith(
      "polygon",
    );
    expect(mockEventTrackingService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          blockchain_network_selected: "ethereum",
          chain_id: "137",
        }),
      }),
    );
  });

  it("sends the solana family with the network of the selected solana account", async () => {
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

    expect(mockBlockchainProviderManager.describeCurrency).toHaveBeenCalledWith(
      "solana",
    );
    expect(mockEventTrackingService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          blockchain_network_selected: "solana",
          chain_id: "mainnet",
        }),
      }),
    );
  });
});
