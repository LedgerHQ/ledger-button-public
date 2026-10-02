import { Just, Nothing } from "purify-ts";
import { describe, expect, it, vi } from "vitest";

import type { BlockchainFamily } from "@api/blockchain-provider/model/types";
import type { Account } from "@api/model/Account";
import type { ButtonCoreContext } from "@api/model/ButtonCoreContext";
import { aCurrencyDescriptor } from "@internal/blockchain-provider/__mocks__/currencyDescriptorMock";
import type { BlockchainProviderManager } from "@internal/blockchain-provider/service/BlockchainProviderManager";

import { resolveTrackedChainId } from "./resolveTrackedChainId";

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

function createContext(
  entries: [BlockchainFamily, Account][],
): ButtonCoreContext {
  return {
    connectedDevice: undefined,
    selectedAccounts: new Map<BlockchainFamily, Account>(entries),
    activeFamily: undefined,
    trustChainId: undefined,
    applicationPath: undefined,
    chainId: 1,
    welcomeScreenCompleted: true,
    hasTrackingConsent: true,
    hasDeveloperMode: false,
    isMobilePlatform: false,
    preferredFiatCurrency: "usd",
  };
}

describe("resolveTrackedChainId", () => {
  it("returns the network of the selected account for that family", () => {
    const describeCurrency = vi
      .fn()
      .mockReturnValue(
        Just(aCurrencyDescriptor({ currencyId: "polygon", networkId: "137" })),
      );

    const chainId = resolveTrackedChainId(
      createContext([["ethereum", polygonAccount]]),
      "ethereum",
      { describeCurrency } as unknown as BlockchainProviderManager,
    );

    expect(describeCurrency).toHaveBeenCalledWith("polygon");
    expect(chainId).toBe("137");
  });

  it("returns null when the family has no selected account", () => {
    const describeCurrency = vi.fn();

    const chainId = resolveTrackedChainId(
      createContext([]),
      "ethereum",
      { describeCurrency } as unknown as BlockchainProviderManager,
    );

    expect(describeCurrency).not.toHaveBeenCalled();
    expect(chainId).toBeNull();
  });

  it("returns null when the selected account currency is unmapped", () => {
    const describeCurrency = vi.fn().mockReturnValue(Nothing);

    const chainId = resolveTrackedChainId(
      createContext([["ethereum", polygonAccount]]),
      "ethereum",
      { describeCurrency } as unknown as BlockchainProviderManager,
    );

    expect(describeCurrency).toHaveBeenCalledWith("polygon");
    expect(chainId).toBeNull();
  });
});
