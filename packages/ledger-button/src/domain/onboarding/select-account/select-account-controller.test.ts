import type { AccountWithFiat } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";

import type { CoreContext } from "../../../context/core-context.js";
import type { LanguageContext } from "../../../context/language-context.js";
import type { Navigation } from "../../../shared/navigation.js";
import { SelectAccountController } from "./select-account-controller.js";

const mockLang = {
  currentTranslation: {
    onboarding: {
      selectAccount: {
        accountCountOne: "1 account",
        accountCountOther: "{count} accounts",
        tokenCountOne: "1 token",
        tokenCountOther: "{count} tokens",
      },
    },
  },
} as unknown as LanguageContext;

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
      mockLang,
    );
    controller.accounts = [ethAccount, btcAccount];
  });

  it.each([
    { description: "returns all accounts in core order when query is empty", query: "", expected: () => [ethAccount, btcAccount] },
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

describe("SelectAccountController.formatGroupCount", () => {
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
      mockLang,
    );
  });

  it("returns the singular form for 1 account", () => {
    expect(controller.formatGroupCount(1)).toBe("1 account");
  });

  it("returns the plural form with the count interpolated", () => {
    expect(controller.formatGroupCount(3)).toBe("3 accounts");
  });
});

describe("SelectAccountController.formatTokenCount", () => {
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
      mockLang,
    );
  });

  it("returns the singular form for 1 token", () => {
    expect(controller.formatTokenCount(1)).toBe("1 token");
  });

  it("returns the plural form with the count interpolated", () => {
    expect(controller.formatTokenCount(5)).toBe("5 tokens");
  });
});

describe("SelectAccountController.handleShowTokensClick", () => {
  let controller: SelectAccountController;
  let navigation: Navigation;
  let core: CoreContext;

  const account = createAccount({
    id: "eth-1",
    name: "john.eth",
    freshAddress: "0xD6abcdef12348d9Z",
  });

  beforeEach(() => {
    const host: ReactiveControllerHost = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };
    core = { setPendingAccountId: vi.fn() } as unknown as CoreContext;
    navigation = { navigateTo: vi.fn() } as unknown as Navigation;
    controller = new SelectAccountController(host, core, navigation, mockLang);
  });

  it("sets the pending account id before navigating", () => {
    controller.handleShowTokensClick(account);

    expect(core.setPendingAccountId).toHaveBeenCalledWith("eth-1");
  });

  it("navigates to the account tokens screen", () => {
    controller.handleShowTokensClick(account);

    expect(navigation.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "accountTokens",
        component: "account-tokens-screen",
        canGoBack: true,
      }),
    );
  });

  it("sets the toolbar title to the account name", () => {
    controller.handleShowTokensClick(account);

    expect(navigation.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({
        toolbar: expect.objectContaining({ title: "john.eth" }),
      }),
    );
  });

  it("sets the toolbar subtitle to the truncated fresh address", () => {
    controller.handleShowTokensClick(account);

    expect(navigation.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({
        toolbar: expect.objectContaining({
          subtitle: controller.truncateAddress(account.freshAddress),
        }),
      }),
    );
  });

  it("sets canClose on the toolbar", () => {
    controller.handleShowTokensClick(account);

    expect(navigation.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({
        toolbar: expect.objectContaining({ canClose: true }),
      }),
    );
  });
});

describe("SelectAccountController.groupedAccounts", () => {
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
      mockLang,
    );
  });

  it("groups accounts sharing the same freshAddress", () => {
    const ethMainnet = createAccount({
      id: "eth-1",
      currencyId: "ethereum",
      freshAddress: "0xabc123",
      fiatBalance: { value: "1000.00", currency: "USD" },
    });
    const polygon = createAccount({
      id: "polygon-1",
      currencyId: "polygon",
      freshAddress: "0xabc123",
      fiatBalance: { value: "500.00", currency: "USD" },
    });
    const ethSecondWallet = createAccount({
      id: "eth-2",
      currencyId: "ethereum",
      freshAddress: "0xdef456",
      fiatBalance: { value: "200.00", currency: "USD" },
    });
    const baseSecondWallet = createAccount({
      id: "base-2",
      currencyId: "base",
      freshAddress: "0xdef456",
      fiatBalance: { value: "50.00", currency: "USD" },
    });

    controller.accounts = [ethMainnet, polygon, ethSecondWallet, baseSecondWallet];

    expect(controller.groupedAccounts).toEqual([
      {
        freshAddress: "0xabc123",
        accounts: [ethMainnet, polygon],
      },
      {
        freshAddress: "0xdef456",
        accounts: [ethSecondWallet, baseSecondWallet],
      },
    ]);
  });

  it("applies search filter before grouping", () => {
    const ethMainnet = createAccount({
      id: "eth-1",
      currencyId: "ethereum",
      ticker: "ETH",
      freshAddress: "0xabc123",
    });
    const polygon = createAccount({
      id: "polygon-1",
      name: "My Polygon",
      currencyId: "polygon",
      ticker: "POL",
      freshAddress: "0xabc123",
    });

    controller.accounts = [ethMainnet, polygon];
    controller.searchQuery = "ETH";
    const result = controller.groupedAccounts;

    expect(result).toHaveLength(1);
    expect(result[0].freshAddress).toBe("0xabc123");
    expect(result[0].accounts.map((a) => a.id)).toEqual(["eth-1"]);
  });

  it("returns empty array when accounts list is empty", () => {
    controller.accounts = [];
    expect(controller.groupedAccounts).toEqual([]);
  });
});

