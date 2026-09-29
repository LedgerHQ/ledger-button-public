import { sha256 } from "ethers";
import { Just } from "purify-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import type { Account } from "@api/model/Account";
import type { EventRequest } from "@internal/backend/model/trackEvent";
import { aCurrencyDescriptor } from "@internal/blockchain-provider/__mocks__/currencyDescriptorMock";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";
import type { Config } from "@internal/config/model/config";
import type { ContextService } from "@internal/context/ContextService";
import type { LoggerPublisher } from "@internal/logger/service/LoggerPublisher";

import { EventTrackingUtils } from "../EventTrackingUtils";
import type { EventTrackingService } from "../service/EventTrackingService";
import { TrackInvoicingTransactionSigned } from "./TrackInvoicingTransactionSigned";

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

describe("TrackInvoicingTransactionSigned", () => {
  let mockEventTrackingService: EventTrackingService;
  let mockBlockchainProviderManager: BlockchainProviderManager;
  let useCase: TrackInvoicingTransactionSigned;

  const trackedEvent = (): EventRequest =>
    vi.mocked(mockEventTrackingService.trackEvent).mock.calls[0][0];

  beforeEach(() => {
    mockEventTrackingService = {
      getSessionId: vi
        .fn()
        .mockReturnValue("a93f987c-11df-40d7-abe7-cfd2c7be92a2"),
      trackEvent: vi.fn().mockResolvedValue(undefined),
    };

    mockBlockchainProviderManager = {
      describeCurrency: vi.fn(),
    } as unknown as BlockchainProviderManager;

    useCase = new TrackInvoicingTransactionSigned(
      () =>
        ({
          debug: vi.fn(),
        }) as unknown as LoggerPublisher,
      mockEventTrackingService,
      { dAppIdentifier: "test-dapp" } as Config,
      {
        getContext: vi.fn().mockReturnValue({
          selectedAccounts: new Map<BlockchainFamily, Account>([
            ["ethereum", polygonAccount],
            ["solana", solanaAccount],
          ]),
        }),
      } as unknown as ContextService,
      mockBlockchainProviderManager,
    );
  });

  it("sends a valid invoicing event for an EVM transaction", async () => {
    vi.mocked(mockBlockchainProviderManager.describeCurrency).mockReturnValue(
      Just(aCurrencyDescriptor({ currencyId: "polygon", networkId: "137" })),
    );
    const unsignedTransaction = "0x02f90552017a8427e021408427e021408304c04c";

    await useCase.execute({
      family: "ethereum",
      transactionHash:
        "0xCAF172BF3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
      unsignedTransaction,
      recipientAddress: "0x111111125421cA6dc452d289314280a0f8842A65",
    });

    expect(mockEventTrackingService.trackEvent).toHaveBeenCalledOnce();
    expect(trackedEvent().data).toMatchObject({
      event_type: "invoicing_transaction_signed",
      transaction_dapp_id: "test-dapp",
      blockchain_network_selected: "ethereum",
      chain_id: "137",
      transaction_hash:
        "caf172bf3784a1ea3dbb2c551de9e2b263c9c4f762589363776cda325b6de11c",
      unsigned_transaction_hash: sha256(unsignedTransaction).slice(2),
      recipient_address: "0x111111125421ca6dc452d289314280a0f8842a65",
    });
    expect(EventTrackingUtils.validateEvent(trackedEvent()).success).toBe(true);
  });

  it("sends a valid invoicing event for a Solana transaction, keeping the base58 hash", async () => {
    vi.mocked(mockBlockchainProviderManager.describeCurrency).mockReturnValue(
      Just(
        aCurrencyDescriptor({
          currencyId: "solana",
          family: "solana",
          networkId: "mainnet",
        }),
      ),
    );
    const messageBytes = new Uint8Array([1, 2, 3, 4]);
    const base58Signature =
      "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW";

    await useCase.execute({
      family: "solana",
      transactionHash: base58Signature,
      unsignedTransaction: messageBytes,
      recipientAddress: "",
    });

    expect(trackedEvent().data).toMatchObject({
      blockchain_network_selected: "solana",
      chain_id: "mainnet",
      transaction_hash: base58Signature,
      unsigned_transaction_hash: sha256(messageBytes).slice(2),
      recipient_address: "",
    });
    expect(EventTrackingUtils.validateEvent(trackedEvent()).success).toBe(true);
  });
});
