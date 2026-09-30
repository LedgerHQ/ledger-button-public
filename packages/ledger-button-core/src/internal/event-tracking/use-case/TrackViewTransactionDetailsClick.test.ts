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
import { TrackViewTransactionDetailsClick } from "./TrackViewTransactionDetailsClick";

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

const solanaSignature =
  "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW";

describe("TrackViewTransactionDetailsClick", () => {
  let mockEventTrackingService: EventTrackingService;
  let mockBlockchainProviderManager: BlockchainProviderManager;
  let useCase: TrackViewTransactionDetailsClick;

  beforeEach(() => {
    mockEventTrackingService = {
      getSessionId: vi.fn().mockReturnValue("session-id"),
      trackEvent: vi.fn().mockResolvedValue(undefined),
    };

    mockBlockchainProviderManager = {
      describeCurrency: vi.fn(),
    } as unknown as BlockchainProviderManager;

    useCase = new TrackViewTransactionDetailsClick(
      () =>
        ({
          debug: vi.fn(),
        }) as unknown as LoggerPublisher,
      mockEventTrackingService,
      { dAppIdentifier: "test-dapp" } as Config,
      {
        getContext: vi.fn().mockReturnValue({
          trustChainId: "trust-chain",
          activeFamily: "ethereum",
          selectedAccounts: new Map<BlockchainFamily, Account>([
            ["ethereum", polygonAccount],
            ["solana", solanaAccount],
          ]),
        }),
      } as unknown as ContextService,
      mockBlockchainProviderManager,
    );
  });

  it("sends the family passed by the caller, not the active family", async () => {
    vi.mocked(mockBlockchainProviderManager.describeCurrency).mockReturnValue(
      Just(
        aCurrencyDescriptor({
          currencyId: "solana",
          family: "solana",
          networkId: "mainnet",
        }),
      ),
    );

    await useCase.execute(solanaSignature, "solana");

    expect(mockBlockchainProviderManager.describeCurrency).toHaveBeenCalledWith(
      "solana",
    );
    expect(mockEventTrackingService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          event_type: "view_transaction_details_clicked",
          blockchain_network_selected: "solana",
          chain_id: "mainnet",
          transaction_hash: solanaSignature,
        }),
      }),
    );
  });
});
