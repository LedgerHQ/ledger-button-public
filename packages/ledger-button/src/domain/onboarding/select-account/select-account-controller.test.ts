/**
 * @vitest-environment jsdom
 */

import type {
  AccountGroup,
  AccountListItem,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { of, Subject } from "rxjs";
import { vi } from "vitest";

import type { CoreContext } from "../../../context/core-context";
import type { LanguageContext } from "../../../context/language-context";
import type { Navigation } from "../../../shared/navigation";
import { RootNavigationComponent } from "../../../shared/root-navigation";
import type { Destinations } from "../../../shared/routes";
import { SelectAccountController } from "./select-account-controller";

vi.mock("../../../shared/root-navigation", () => {
  class MockRootNavigationComponent {
    closeModal = vi.fn();
    requestUpdate = vi.fn();
    navigateToHome = vi.fn();
    getModalMode = vi.fn().mockReturnValue("modal");
    presentConnectionSuccessOverlay = vi.fn();
  }

  return { RootNavigationComponent: MockRootNavigationComponent };
});

type MockRootNavigationHost = {
  closeModal: ReturnType<typeof vi.fn>;
  requestUpdate: ReturnType<typeof vi.fn>;
  navigateToHome: ReturnType<typeof vi.fn>;
  getModalMode: ReturnType<typeof vi.fn>;
  presentConnectionSuccessOverlay: ReturnType<typeof vi.fn>;
};

function createRootNavigationHost(
  overrides: Partial<
    Pick<MockRootNavigationHost, "closeModal" | "requestUpdate">
  > = {},
): RootNavigationComponent {
  const MockHost = RootNavigationComponent as unknown as new () => MockRootNavigationHost;
  return Object.assign(new MockHost(), overrides) as unknown as RootNavigationComponent;
}

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
    error: {
      ledgerSync: {
        NoCompatibleAccounts: {
          title: "No compatible account found",
          cta1: "Create a new account on Ledger Live",
          cta2: "Use another Ledger device",
        },
      },
    },
  },
} as unknown as LanguageContext;

const mockDestinations = {
  onboarding: { name: "onboarding" },
  onboardingFlow: { name: "onboarding-flow" },
} as unknown as Destinations;

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
  destinations?: Destinations;
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
    options?.destinations ?? mockDestinations,
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
      createGroup([
        createAccount({
          balance: undefined,
          balanceLoadingState: "loading",
        }),
      ]),
      createGroup([createAccount({ balance: "1" })]),
    ];

    expect(controller.isBalanceLoading).toBe(true);
  });

  it("reports loaded once every account has a balance", () => {
    const { controller } = createController();
    controller.groups = [createGroup([createAccount({ balance: "1" })])];

    expect(controller.isBalanceLoading).toBe(false);
  });

  it("does not report loading when balance hydration failed", () => {
    const { controller } = createController();
    controller.groups = [
      createGroup([
        createAccount({
          balance: undefined,
          balanceError: true,
          balanceLoadingState: "error",
        }),
      ]),
    ];

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

describe("SelectAccountController compatible accounts empty state", () => {
  it("does not surface the error before the first groups emission", () => {
    const { controller } = createController({
      core: {
        observeAccountGroups: vi.fn().mockReturnValue(new Subject()),
      } as unknown as Partial<CoreContext>,
    });

    controller.getAccounts();

    expect(controller.hasLoadedGroups).toBe(false);
    expect(controller.showCompatibleAccountsError).toBe(false);
    expect(controller.errorData).toBeUndefined();
  });

  it("builds the NoCompatibleAccounts error when the loaded picker is empty", () => {
    const { controller } = createController({
      family: "solana",
    });

    controller.getAccounts();

    expect(controller.hasLoadedGroups).toBe(true);
    expect(controller.showCompatibleAccountsError).toBe(true);
    expect(controller.errorData).toEqual(
      expect.objectContaining({
        title: "No compatible account found",
        cta1: expect.objectContaining({
          label: "Create a new account on Ledger Live",
        }),
        cta2: expect.objectContaining({
          label: "Use another Ledger device",
        }),
      }),
    );
  });

  it("clears the error when accounts are present", () => {
    const group = createGroup([createAccount()]);
    const { controller } = createController({
      core: {
        observeAccountGroups: vi.fn().mockReturnValue(of([group])),
      } as unknown as Partial<CoreContext>,
    });

    controller.getAccounts();

    expect(controller.showCompatibleAccountsError).toBe(false);
    expect(controller.errorData).toBeUndefined();
  });

  it("hides the compatible-accounts error while a search query is active", () => {
    const groups$ = new Subject<AccountGroup[]>();
    const { controller } = createController({
      core: {
        observeAccountGroups: vi.fn().mockReturnValue(groups$),
      } as unknown as Partial<CoreContext>,
      family: "solana",
    });

    controller.getAccounts();
    groups$.next([]);

    expect(controller.showCompatibleAccountsError).toBe(true);

    controller.handleSearchInput(
      new CustomEvent("search-input-change", { detail: { value: "usdt" } }),
    );
    groups$.next([]);

    expect(controller.showCompatibleAccountsError).toBe(false);
    expect(controller.errorData).toBeUndefined();
  });

  it("opens Ledger Live accounts and closes the modal when the primary CTA is used", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const closeModal = vi.fn();
    const navigation = {
      host: createRootNavigationHost({ closeModal }),
    } as unknown as Navigation;

    const { controller } = createController({ navigation });

    controller.getAccounts();
    controller.errorData?.cta1?.action();

    expect(open).toHaveBeenCalledWith(
      "ledgerlive://accounts",
      "_blank",
      "noopener,noreferrer",
    );
    expect(closeModal).toHaveBeenCalled();
    expect(controller.errorData).toBeUndefined();

    open.mockRestore();
  });

  it("resets the session then restarts onboarding when the secondary CTA is used", async () => {
    const navigateTo = vi.fn();
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const { controller } = createController({
      navigation: { navigateTo, host: {} } as unknown as Navigation,
      core: {
        observeAccountGroups: vi.fn().mockReturnValue(of([])),
        disconnect,
      } as unknown as Partial<CoreContext>,
    });

    controller.getAccounts();
    controller.errorData?.cta2?.action();
    await vi.waitFor(() => {
      expect(disconnect).toHaveBeenCalledWith();
      expect(navigateTo).toHaveBeenCalledWith(mockDestinations.onboardingFlow);
    });
  });

  it("hides the toolbar back arrow while the compatible-accounts error is shown", () => {
    const requestUpdate = vi.fn();
    const selectAccountCanGoBack = vi.fn().mockReturnValue(true);
    const navigation = {
      currentScreen: {
        name: "selectAccount",
        canGoBack: selectAccountCanGoBack,
      },
      host: createRootNavigationHost({ requestUpdate }),
    } as unknown as Navigation;

    const { controller } = createController({
      navigation,
      destinations: {
        onboarding: { name: "onboarding" },
        onboardingFlow: { name: "onboarding-flow" },
        selectAccount: { canGoBack: selectAccountCanGoBack },
      } as unknown as Destinations,
    });

    controller.getAccounts();

    expect(navigation.currentScreen?.canGoBack).toBe(false);
    expect(requestUpdate).toHaveBeenCalled();
  });

  it("restores the toolbar back arrow when accounts become available", () => {
    const groups$ = new Subject<AccountGroup[]>();
    const selectAccountCanGoBack = vi.fn().mockReturnValue(true);
    const navigation = {
      currentScreen: {
        name: "selectAccount",
        canGoBack: false as boolean | ((core: unknown) => boolean),
      },
      host: createRootNavigationHost(),
    } as unknown as Navigation;

    const { controller } = createController({
      navigation,
      destinations: {
        onboarding: { name: "onboarding" },
        onboardingFlow: { name: "onboarding-flow" },
        selectAccount: { canGoBack: selectAccountCanGoBack },
      } as unknown as Destinations,
      core: {
        observeAccountGroups: vi.fn().mockReturnValue(groups$),
      } as unknown as Partial<CoreContext>,
    });

    controller.getAccounts();
    groups$.next([]);
    expect(navigation.currentScreen?.canGoBack).toBe(false);

    groups$.next([createGroup([createAccount()])]);
    expect(navigation.currentScreen?.canGoBack).toBe(selectAccountCanGoBack);
  });
});
