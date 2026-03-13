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
    { description: "returns all accounts when query is empty", query: "", expected: () => [ethAccount, btcAccount] },
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
