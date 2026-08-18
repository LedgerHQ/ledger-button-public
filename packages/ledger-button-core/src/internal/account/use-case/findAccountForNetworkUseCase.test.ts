import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockchainFamily } from "@api/blockchain-provider/model/types.js";
import type { Account } from "@api/model/Account.js";
import type { ButtonCoreContext } from "@api/model/ButtonCoreContext.js";
import type { ContextService } from "@internal/context/ContextService.js";

import type { AccountService } from "../service/AccountService.js";
import { FindAccountForNetworkUseCase } from "./findAccountForNetworkUseCase.js";

function createAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0xaaa",
    seedIdentifier: "seed-1",
    derivationMode: "default",
    index: 0,
    name: "My Ethereum Account",
    ticker: "ETH",
    balance: undefined,
    tokens: [],
    ...overrides,
  };
}

function createContext(selected?: Account): ButtonCoreContext {
  return {
    connectedDevice: undefined,
    selectedAccounts: selected
      ? new Map<BlockchainFamily, Account>([["ethereum", selected]])
      : new Map(),
    activeFamily: selected ? "ethereum" : undefined,
    trustChainId: undefined,
    applicationPath: undefined,
    chainId: 1,
    welcomeScreenCompleted: true,
    hasTrackingConsent: undefined,
    hasDeveloperMode: false,
    isMobilePlatform: false,
    preferredFiatCurrency: "USD",
  };
}

describe("FindAccountForNetworkUseCase", () => {
  const ethereum = createAccount({ id: "eth", currencyId: "ethereum" });
  const polygon = createAccount({ id: "poly", currencyId: "polygon" });
  const otherAddress = createAccount({
    id: "other",
    currencyId: "polygon",
    freshAddress: "0xbbb",
  });

  let accountService: { getAccounts: ReturnType<typeof vi.fn> };

  function makeUseCase(selected: Account | null = ethereum) {
    accountService = {
      getAccounts: vi.fn().mockReturnValue([ethereum, polygon, otherAddress]),
    };

    return new FindAccountForNetworkUseCase(
      {
        getContext: () => createContext(selected ?? undefined),
      } as unknown as ContextService,
      accountService as unknown as AccountService,
    );
  }

  let useCase: FindAccountForNetworkUseCase;

  beforeEach(() => {
    useCase = makeUseCase();
  });

  it("should return the account of the selected address on the given network", () => {
    expect(useCase.execute("polygon").extract()).toBe(polygon);
  });

  it("should ignore accounts of another address", () => {
    const result = makeUseCase(
      createAccount({ id: "eth", freshAddress: "0xccc" }),
    ).execute("polygon");

    expect(result.isNothing()).toBe(true);
  });

  it("should return nothing when the network is unknown", () => {
    expect(useCase.execute("bitcoin").isNothing()).toBe(true);
  });

  it("should return nothing when no account is selected", () => {
    expect(makeUseCase(null).execute("ethereum").isNothing()).toBe(true);
  });
});
