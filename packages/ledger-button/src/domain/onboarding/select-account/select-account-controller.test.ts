import type { AccountWithFiat } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { of } from "rxjs";

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
    {
      description: "returns all accounts in core order when query is empty",
      query: "",
      expected: () => [ethAccount, btcAccount],
    },
    {
      description: "filters by account name",
      query: "Bitcoin",
      expected: () => [btcAccount],
    },
    {
      description: "filters by account address",
      query: "0xabc123",
      expected: () => [ethAccount],
    },
    {
      description: "filters by account ticker",
      query: "eth",
      expected: () => [ethAccount],
    },
    {
      description: "filters by token ticker",
      query: "usdt",
      expected: () => [ethAccount],
    },
    {
      description: "filters by token name",
      query: "Tether",
      expected: () => [ethAccount],
    },
    {
      description: "returns empty array when no match",
      query: "DOGE",
      expected: () => [],
    },
  ])("$description", ({ query, expected }) => {
    controller.searchQuery = query;
    expect(controller.filteredAccounts).toEqual(expected());
  });
});

describe("SelectAccountController.truncateAddress", () => {
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

  it.each([
    {
      description: "truncates a standard Ethereum address",
      address: "0xD6abcdef12348d9Z",
      expected: "0xD6...8d9Z",
    },
    {
      description: "truncates a long address keeping first 4 and last 4 chars",
      address: "0x1234567890abcdef",
      expected: "0x12...cdef",
    },
    {
      description: "returns the full string when exactly 8 characters",
      address: "12345678",
      expected: "12345678",
    },
    {
      description: "returns the full string when shorter than 8 characters",
      address: "abcd",
      expected: "abcd",
    },
  ])("$description", ({ address, expected }) => {
    expect(controller.truncateAddress(address)).toBe(expected);
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
    navigation = { navigateTo: vi.fn() } as unknown as Navigation;
    controller = new SelectAccountController(
      host,
      {} as CoreContext,
      navigation,
      mockLang,
    );
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

  it("passes the account as screenData", () => {
    controller.handleShowTokensClick(account);

    expect(navigation.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ screenData: account }),
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

describe("SelectAccountController.getAccountFiatValue", () => {
  const controller = new SelectAccountController(
    {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    },
    {} as CoreContext,
    {} as Navigation,
    mockLang,
  );

  it("returns the native fiat balance when there are no tokens", () => {
    const account = createAccount({
      fiatBalance: { value: "100.00", currency: "USD" },
      tokens: [],
    });

    expect(controller.getAccountFiatValue(account)).toEqual({
      value: "100.00",
      currency: "USD",
    });
  });

  it("returns the sum of native and token fiat balances", () => {
    const account = createAccount({
      fiatBalance: { value: "100.00", currency: "USD" },
      tokens: [
        {
          ledgerId: "ethereum/erc20/usdt",
          ticker: "USDT",
          name: "Tether",
          balance: "50000000",
          fiatBalance: { value: "50.00", currency: "USD" },
        },
        {
          ledgerId: "ethereum/erc20/dai",
          ticker: "DAI",
          name: "Dai",
          balance: "25000000000000000000",
          fiatBalance: { value: "25.00", currency: "USD" },
        },
      ],
    });

    expect(controller.getAccountFiatValue(account)).toEqual({
      value: "175.00",
      currency: "USD",
    });
  });

  it("ignores tokens without a fiat balance in the sum", () => {
    const account = createAccount({
      fiatBalance: { value: "200.00", currency: "USD" },
      tokens: [
        {
          ledgerId: "ethereum/erc20/usdt",
          ticker: "USDT",
          name: "Tether",
          balance: "50000000",
          fiatBalance: undefined,
        },
      ],
    });

    expect(controller.getAccountFiatValue(account)).toEqual({
      value: "200.00",
      currency: "USD",
    });
  });

  it("returns the token fiat sum when native fiat value is zero", () => {
    const account = createAccount({
      fiatBalance: { value: "0.00", currency: "USD" },
      tokens: [
        {
          ledgerId: "ethereum/erc20/usdt",
          ticker: "USDT",
          name: "Tether",
          balance: "50000000",
          fiatBalance: { value: "50.00", currency: "USD" },
        },
      ],
    });

    expect(controller.getAccountFiatValue(account)).toEqual({
      value: "50.00",
      currency: "USD",
    });
  });

  it("returns undefined when native fiatBalance is undefined", () => {
    const account = createAccount({ fiatBalance: undefined, tokens: [] });

    expect(controller.getAccountFiatValue(account)).toBeUndefined();
  });

  it("returns undefined when native fiatBalance is undefined even if tokens have fiat", () => {
    const account = createAccount({
      fiatBalance: undefined,
      tokens: [
        {
          ledgerId: "ethereum/erc20/usdt",
          ticker: "USDT",
          name: "Tether",
          balance: "50000000",
          fiatBalance: { value: "50.00", currency: "USD" },
        },
      ],
    });

    expect(controller.getAccountFiatValue(account)).toBeUndefined();
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

    controller.accounts = [
      ethMainnet,
      polygon,
      ethSecondWallet,
      baseSecondWallet,
    ];

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

  it("sorts groups by descending total fiat balance", () => {
    const ethMainnet = createAccount({
      id: "eth-1",
      freshAddress: "0xabc123",
      fiatBalance: { value: "1000.00", currency: "USD" },
    });
    const polygon = createAccount({
      id: "polygon-1",
      freshAddress: "0xabc123",
      fiatBalance: { value: "500.00", currency: "USD" },
    });
    const btc = createAccount({
      id: "btc-1",
      freshAddress: "bc1qxyz",
      fiatBalance: { value: "50000.00", currency: "USD" },
    });

    controller.accounts = [ethMainnet, polygon, btc];

    const result = controller.groupedAccounts;
    expect(result[0].freshAddress).toBe("bc1qxyz");
    expect(result[1].freshAddress).toBe("0xabc123");
  });

  it("places the group with higher combined balance first when multiple accounts share an address", () => {
    const ethMainnet = createAccount({
      id: "eth-1",
      freshAddress: "0xabc123",
      fiatBalance: { value: "300.00", currency: "USD" },
    });
    const polygon = createAccount({
      id: "polygon-1",
      freshAddress: "0xabc123",
      fiatBalance: { value: "200.00", currency: "USD" },
    });
    const btc = createAccount({
      id: "btc-1",
      freshAddress: "bc1qxyz",
      fiatBalance: { value: "400.00", currency: "USD" },
    });

    controller.accounts = [ethMainnet, polygon, btc];

    // 0xabc123 total = 500, bc1qxyz total = 400 → 0xabc123 should be first
    const result = controller.groupedAccounts;
    expect(result[0].freshAddress).toBe("0xabc123");
    expect(result[1].freshAddress).toBe("bc1qxyz");
  });

  it("includes token fiat balances in the group total when sorting", () => {
    const ethWithTokens = createAccount({
      id: "eth-1",
      freshAddress: "0xabc123",
      fiatBalance: { value: "100.00", currency: "USD" },
      tokens: [
        {
          ledgerId: "ethereum/erc20/usdt",
          ticker: "USDT",
          name: "Tether",
          balance: "50000000",
          fiatBalance: { value: "900.00", currency: "USD" },
        },
      ],
    });
    const btc = createAccount({
      id: "btc-1",
      freshAddress: "bc1qxyz",
      fiatBalance: { value: "500.00", currency: "USD" },
      tokens: [],
    });

    controller.accounts = [btc, ethWithTokens];

    // ethWithTokens total = 100 + 900 = 1000, btc total = 500 → eth should be first
    const result = controller.groupedAccounts;
    expect(result[0].freshAddress).toBe("0xabc123");
    expect(result[1].freshAddress).toBe("bc1qxyz");
  });

  it("treats missing fiat balance as zero when sorting", () => {
    const withBalance = createAccount({
      id: "eth-1",
      freshAddress: "0xabc123",
      fiatBalance: { value: "100.00", currency: "USD" },
    });
    const withoutBalance = createAccount({
      id: "btc-1",
      freshAddress: "bc1qxyz",
      fiatBalance: undefined,
    });

    controller.accounts = [withoutBalance, withBalance];

    const result = controller.groupedAccounts;
    expect(result[0].freshAddress).toBe("0xabc123");
    expect(result[1].freshAddress).toBe("bc1qxyz");
  });

  it("returns empty array when accounts list is empty", () => {
    controller.accounts = [];
    expect(controller.groupedAccounts).toEqual([]);
  });
});

describe("SelectAccountController.getAccounts family filtering", () => {
  const createHost = (): ReactiveControllerHost => ({
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  });

  it("forwards the requested family to core.observeAccounts", () => {
    const observeAccounts = vi.fn().mockReturnValue(of([]));
    const core = { observeAccounts } as unknown as CoreContext;
    const controller = new SelectAccountController(
      createHost(),
      core,
      {} as Navigation,
      mockLang,
      "solana",
    );

    controller.getAccounts();

    expect(observeAccounts).toHaveBeenCalledWith({ family: "solana" });
  });

  it("leaves family undefined when the selection was not scoped to a dApp request", () => {
    const observeAccounts = vi.fn().mockReturnValue(of([]));
    const core = { observeAccounts } as unknown as CoreContext;
    const controller = new SelectAccountController(
      createHost(),
      core,
      {} as Navigation,
      mockLang,
    );

    controller.getAccounts({ forceRefresh: true });

    expect(observeAccounts).toHaveBeenCalledWith({
      forceRefresh: true,
      family: undefined,
    });
  });
});
