import type { AccountWithFiat } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";

import type { CoreContext } from "../../../context/core-context.js";
import type { Navigation } from "../../../shared/navigation.js";
import { SelectAccountController } from "./select-account-controller.js";

function createAccount(
  overrides: Partial<AccountWithFiat> = {},
): AccountWithFiat {
  return {
    id: "account-1",
    currencyId: "ethereum",
    freshAddress: "0xabc123",
    seedIdentifier: "seed-1",
    derivationMode: "",
    index: 0,
    name: "My Ethereum",
    ticker: "ETH",
    balance: "1000000000000000000",
    tokens: [],
    fiatBalance: undefined,
    fiatError: false,
    balanceLoadingState: "loaded",
    fiatLoadingState: "loaded",
    ...overrides,
  };
}

describe("SelectAccountController.filteredAccounts", () => {
  let controller: SelectAccountController;

  const ethAccount = createAccount({
    id: "eth-1",
    name: "My Ethereum",
    freshAddress: "0xabc123def456",
    ticker: "ETH",
    fiatBalance: { value: "2500.00", currency: "USD" },
    tokens: [
      {
        ledgerId: "ethereum/erc20/tether_usd",
        ticker: "USDT",
        name: "Tether USD",
        balance: "1000000",
        fiatBalance: undefined,
      },
    ],
  });

  const btcAccount = createAccount({
    id: "btc-1",
    name: "My Bitcoin",
    freshAddress: "bc1qxyz789",
    ticker: "BTC",
    fiatBalance: { value: "50000.00", currency: "USD" },
    tokens: [],
  });

  beforeEach(() => {
    const host: ReactiveControllerHost = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };
    controller = new SelectAccountController(
      host,
      {} as CoreContext,
      {} as Navigation,
    );
    controller.accounts = [ethAccount, btcAccount];
  });

  it.each([
    { description: "returns all accounts sorted by fiat value descending when query is empty", query: "", expected: () => [btcAccount, ethAccount] },
    { description: "filters by account name", query: "Bitcoin", expected: () => [btcAccount] },
    { description: "filters by account address", query: "0xabc123", expected: () => [ethAccount] },
    { description: "filters by account ticker", query: "eth", expected: () => [ethAccount] },
    { description: "filters by token ticker", query: "usdt", expected: () => [ethAccount] },
    { description: "filters by token name", query: "Tether", expected: () => [ethAccount] },
    { description: "returns empty array when no match", query: "DOGE", expected: () => [] },
  ])("$description", ({ query, expected }) => {
    controller.searchQuery = query;
    expect(controller.filteredAccounts).toEqual(expected());
  });
});

describe("SelectAccountController.filteredAccounts sorting", () => {
  let controller: SelectAccountController;

  beforeEach(() => {
    const host: ReactiveControllerHost = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };
    controller = new SelectAccountController(
      host,
      {} as CoreContext,
      {} as Navigation,
    );
  });

  it("sorts accounts by fiat balance descending", () => {
    const lowValue = createAccount({
      id: "low",
      name: "Low",
      fiatBalance: { value: "100.00", currency: "USD" },
    });
    const highValue = createAccount({
      id: "high",
      name: "High",
      fiatBalance: { value: "5000.00", currency: "USD" },
    });
    const midValue = createAccount({
      id: "mid",
      name: "Mid",
      fiatBalance: { value: "1000.00", currency: "USD" },
    });

    controller.accounts = [lowValue, highValue, midValue];
    const result = controller.filteredAccounts;

    expect(result.map((a) => a.id)).toEqual(["high", "mid", "low"]);
  });

  it("places accounts with no fiat balance at the end", () => {
    const withFiat = createAccount({
      id: "with-fiat",
      name: "With Fiat",
      fiatBalance: { value: "500.00", currency: "USD" },
    });
    const withoutFiat = createAccount({
      id: "without-fiat",
      name: "Without Fiat",
      fiatBalance: undefined,
    });

    controller.accounts = [withoutFiat, withFiat];
    const result = controller.filteredAccounts;

    expect(result.map((a) => a.id)).toEqual(["with-fiat", "without-fiat"]);
  });

  it("preserves sorting after filtering", () => {
    const ethLow = createAccount({
      id: "eth-low",
      name: "Ethereum Low",
      ticker: "ETH",
      fiatBalance: { value: "100.00", currency: "USD" },
    });
    const ethHigh = createAccount({
      id: "eth-high",
      name: "Ethereum High",
      ticker: "ETH",
      fiatBalance: { value: "9000.00", currency: "USD" },
    });
    const btc = createAccount({
      id: "btc",
      name: "Bitcoin",
      ticker: "BTC",
      fiatBalance: { value: "50000.00", currency: "USD" },
    });

    controller.accounts = [ethLow, ethHigh, btc];
    controller.searchQuery = "ETH";
    const result = controller.filteredAccounts;

    expect(result.map((a) => a.id)).toEqual(["eth-high", "eth-low"]);
  });
});
