import type {
  AccountGroup,
  AccountListItem,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { of, Subject } from "rxjs";

import type { CoreContext } from "../../../context/core-context";
import type { LanguageContext } from "../../../context/language-context";
import type { Navigation } from "../../../shared/navigation";
import { SelectAccountController } from "./select-account-controller";

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

const createHost = (): ReactiveControllerHost => ({
  addController: vi.fn(),
  removeController: vi.fn(),
  requestUpdate: vi.fn(),
  updateComplete: Promise.resolve(true),
});

function createAccount(
  overrides: Partial<AccountListItem> = {},
): AccountListItem {
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
    totalFiatValue: undefined,
    displayTokens: [],
    ...overrides,
  };
}

function createGroup(accounts: AccountListItem[]): AccountGroup {
  return {
    freshAddress: accounts[0]?.freshAddress ?? "0xabc123",
    totalFiatValue: undefined,
    accounts,
  };
}

function createController(options?: {
  core?: Partial<CoreContext>;
  navigation?: Navigation;
  family?: "ethereum" | "solana";
}) {
  const observeAccountGroups = vi.fn().mockReturnValue(of([]));
  const core = {
    observeAccountGroups,
    ...options?.core,
  } as unknown as CoreContext;

  const controller = new SelectAccountController(
    createHost(),
    core,
    options?.navigation ?? ({} as Navigation),
    mockLang,
    options?.family,
  );

  return { controller, observeAccountGroups };
}

describe("SelectAccountController.getAccounts", () => {
  it("forwards the requested family to core.observeAccountGroups", () => {
    const { controller, observeAccountGroups } = createController({
      family: "solana",
    });

    controller.getAccounts();

    expect(observeAccountGroups).toHaveBeenCalledWith(
      expect.objectContaining({ family: "solana" }),
    );
  });

  it("leaves family undefined when the selection was not scoped to a dApp request", () => {
    const { controller, observeAccountGroups } = createController();

    controller.getAccounts({ forceRefresh: true });

    expect(observeAccountGroups).toHaveBeenCalledWith(
      expect.objectContaining({ forceRefresh: true, family: undefined }),
    );
  });

  it("stores the groups emitted by the core", () => {
    const group = createGroup([createAccount()]);
    const { controller } = createController({
      core: {
        observeAccountGroups: vi.fn().mockReturnValue(of([group])),
      } as unknown as Partial<CoreContext>,
    });

    controller.getAccounts();

    expect(controller.groups).toEqual([group]);
  });

  it("unsubscribes from the previous stream when refreshing", () => {
    const first = new Subject<AccountGroup[]>();
    const second = new Subject<AccountGroup[]>();
    const observeAccountGroups = vi
      .fn()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const { controller } = createController({
      core: { observeAccountGroups } as unknown as Partial<CoreContext>,
    });

    controller.getAccounts();
    controller.getAccounts({ forceRefresh: true });

    expect(first.observed).toBe(false);
    expect(second.observed).toBe(true);
  });
});

describe("SelectAccountController search query", () => {
  it("starts with an empty query", () => {
    const { controller } = createController();

    expect(controller.searchQuery).toBe("");
  });

  it("pushes the typed query into the stream passed to the core", () => {
    const { controller, observeAccountGroups } = createController();
    controller.getAccounts();

    const emitted: string[] = [];
    observeAccountGroups.mock.calls[0][0].searchQuery$.subscribe(
      (query: string) => emitted.push(query),
    );

    controller.handleSearchInput(
      new CustomEvent("search-input-change", { detail: { value: "usdt" } }),
    );

    expect(controller.searchQuery).toBe("usdt");
    expect(emitted).toEqual(["", "usdt"]);
  });

  it("resets the query when cleared", () => {
    const { controller } = createController();

    controller.handleSearchInput(
      new CustomEvent("search-input-change", { detail: { value: "usdt" } }),
    );
    controller.handleSearchClear();

    expect(controller.searchQuery).toBe("");
  });

  it("keeps the same query stream across refreshes", () => {
    const { controller, observeAccountGroups } = createController();

    controller.getAccounts();
    controller.getAccounts({ forceRefresh: true });

    expect(observeAccountGroups.mock.calls[0][0].searchQuery$).toBe(
      observeAccountGroups.mock.calls[1][0].searchQuery$,
    );
  });
});

describe("SelectAccountController loading state", () => {
  it("reports loading while an account has no balance yet", () => {
    const { controller } = createController();
    controller.groups = [
      createGroup([createAccount({ balance: undefined })]),
      createGroup([createAccount({ balance: "1" })]),
    ];

    expect(controller.isBalanceLoading).toBe(true);
  });

  it("reports loaded once every account has a balance", () => {
    const { controller } = createController();
    controller.groups = [createGroup([createAccount({ balance: "1" })])];

    expect(controller.isBalanceLoading).toBe(false);
  });

  it("maps the per-account loading states", () => {
    const { controller } = createController();

    expect(
      controller.isAccountBalanceLoading(
        createAccount({ balanceLoadingState: "loading" }),
      ),
    ).toBe(true);
    expect(
      controller.hasAccountBalanceError(
        createAccount({ balanceLoadingState: "error" }),
      ),
    ).toBe(true);
    expect(
      controller.isAccountFiatLoading(
        createAccount({ fiatLoadingState: "loading" }),
      ),
    ).toBe(true);
    expect(
      controller.hasAccountFiatError(
        createAccount({ fiatLoadingState: "error" }),
      ),
    ).toBe(true);
  });
});

describe("SelectAccountController formatting", () => {
  it.each([
    {
      description: "truncates the address for the group header",
      address: "0xC5aB1234567890abcdefA470",
      expected: "0xC5...A470",
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
    const { controller } = createController();

    expect(controller.truncateAddress(address)).toBe(expected);
  });

  it("pluralises the account count", () => {
    const { controller } = createController();

    expect(controller.formatGroupCount(1)).toBe("1 account");
    expect(controller.formatGroupCount(3)).toBe("3 accounts");
  });

  it("pluralises the token count", () => {
    const { controller } = createController();

    expect(controller.formatTokenCount(1)).toBe("1 token");
    expect(controller.formatTokenCount(4)).toBe("4 tokens");
  });
});

describe("SelectAccountController navigation", () => {
  it("navigates to the token screen with the account as screen data", () => {
    const navigateTo = vi.fn();
    const account = createAccount({
      name: "My Ethereum",
      freshAddress: "0xabcdef1234567890",
    });
    const { controller } = createController({
      navigation: { navigateTo } as unknown as Navigation,
    });

    controller.handleShowTokensClick(account);

    expect(navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "accountTokens",
        component: "account-tokens-screen",
        screenData: account,
        toolbar: expect.objectContaining({
          title: "My Ethereum",
          subtitle: "0xab...7890",
        }),
      }),
    );
  });
});
