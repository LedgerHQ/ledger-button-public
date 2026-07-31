/**
 * @vitest-environment jsdom
 */

import type { Account } from "@ledgerhq/ledger-wallet-provider-core";
import { Subject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreContext } from "../context/core-context.js";
import type { LanguageContext } from "../context/language-context.js";
import type { NavigationHost } from "./navigation.js";
import { RootNavigationController } from "./root-navigation-controller.js";

vi.mock("./navigation.js", () => ({
  Navigation: class {
    navigateTo = vi.fn();
    navigateBack = vi.fn();
    resetNavigation = vi.fn();
    currentScreen = null;
  },
}));

// `routes.js` eagerly imports every screen web component; stub it so the
// controller can be unit-tested without pulling the whole component tree.
vi.mock("./routes.js", () => {
  const make = (name: string) => ({
    name,
    component: name,
    canGoBack: false,
    toolbar: {},
  });
  return {
    makeDestinations: () => ({
      home: make("home"),
      onboardingFlow: make("onboarding-flow"),
      mobileOnboarding: make("mobile-onboarding"),
      signingFlow: make("signing-flow"),
      fetchAccounts: make("fetch-accounts"),
    }),
    resolveCanGoBack: () => false,
  };
});

vi.mock("../context/language-context.js", () => ({
  LanguageContext: { LANGUAGE_CHANGE: "language-change" },
}));

const ethAccount = {
  freshAddress: "0xabc123",
  currencyId: "ethereum",
} as unknown as Account;
const solAccount = { currencyId: "solana" } as Account;

describe("RootNavigationController active-account accessors", () => {
  let host: NavigationHost;
  let core: CoreContext;
  let controller: RootNavigationController;

  beforeEach(() => {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
      closeModal: vi.fn(),
    } as unknown as NavigationHost;

    core = {
      getActiveSelectedAccount: vi.fn().mockReturnValue(ethAccount),
      getSelectedAccount: vi.fn().mockReturnValue(ethAccount),
      isMobile: vi.fn().mockReturnValue(false),
      getConnectedDevice: vi.fn(),
      observeContext: vi.fn(() => new Subject()),
    } as unknown as CoreContext;

    controller = new RootNavigationController(
      host,
      core,
      {} as unknown as LanguageContext,
      {} as unknown as HTMLElement,
    );
  });

  it("resolves the initial state from the active selected account", async () => {
    await controller.computeInitialState();

    expect(controller.navigation.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ name: "home" }),
    );
  });

  it("gates account-dependent routes on the active selected account", () => {
    controller.navigationIntent("selectAccount", undefined);
    controller.navigationIntent("home", undefined);
    controller.navigationIntent("signTransaction", undefined);

    const navigateTo = controller.navigation.navigateTo as ReturnType<
      typeof vi.fn
    >;
    expect(navigateTo).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: "home" }),
    );
    expect(navigateTo).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ name: "signing-flow" }),
    );
  });

  it("exposes the active selected account via the selectedAccount getter", () => {
    expect(controller.selectedAccount).toBe(ethAccount);
  });
});

describe("RootNavigationController switchAccount", () => {
  let host: NavigationHost;
  let core: CoreContext;
  let controller: RootNavigationController;

  function setup(coreOverrides: Partial<CoreContext>) {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
      closeModal: vi.fn(),
    } as unknown as NavigationHost;

    core = {
      getActiveFamily: vi.fn(() => undefined),
      observeContext: vi.fn(() => new Subject()),
      ...coreOverrides,
    } as unknown as CoreContext;

    controller = new RootNavigationController(
      host,
      core,
      {} as unknown as LanguageContext,
      document.createElement("div"),
    );
    vi.spyOn(controller.navigation, "navigateTo").mockImplementation(
      () => undefined,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes the account picker to the active family", () => {
    setup({
      getActiveFamily: vi.fn(
        () => "solana",
      ) as unknown as CoreContext["getActiveFamily"],
    });

    controller.switchAccount();

    expect(controller.params).toEqual({
      name: "selectAccount",
      params: { family: "solana" },
    });
    expect(controller.navigation.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ name: "fetch-accounts" }),
    );
  });

  it("leaves the picker unscoped when there is no active family", () => {
    setup({
      getActiveFamily: vi.fn(
        () => undefined,
      ) as unknown as CoreContext["getActiveFamily"],
    });

    controller.switchAccount();

    expect(controller.params).toBeUndefined();
    expect(controller.navigation.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ name: "fetch-accounts" }),
    );
  });
});

describe("RootNavigationController selectAccount navigation", () => {
  let host: NavigationHost;
  let core: CoreContext;
  let controller: RootNavigationController;
  let navigateToSpy: ReturnType<typeof vi.spyOn>;

  function setup(coreOverrides: Partial<CoreContext>) {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
      closeModal: vi.fn(),
    } as unknown as NavigationHost;

    core = {
      getActiveSelectedAccount: vi.fn(() => undefined),
      getSelectedAccount: vi.fn(() => undefined),
      isMobile: vi.fn(() => false),
      getConnectedDevice: vi.fn(() => undefined),
      observeContext: vi.fn(() => new Subject()),
      ...coreOverrides,
    } as unknown as CoreContext;

    const languages = {} as LanguageContext;
    const modalContent = document.createElement("div");

    controller = new RootNavigationController(
      host,
      core,
      languages,
      modalContent,
    );
    navigateToSpy = vi
      .spyOn(controller.navigation, "navigateTo")
      .mockImplementation(() => undefined);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the account picker for an EVM request while only Solana is connected", async () => {
    setup({
      getSelectedAccount: vi.fn((family) =>
        family === "ethereum" ? undefined : solAccount,
      ) as unknown as CoreContext["getSelectedAccount"],
      getActiveSelectedAccount: vi.fn(
        () => solAccount,
      ) as unknown as CoreContext["getActiveSelectedAccount"],
    });

    controller.navigationIntent("selectAccount", {
      name: "selectAccount",
      params: { family: "ethereum" },
    });

    await vi.waitFor(() =>
      expect(navigateToSpy).toHaveBeenCalledWith(
        expect.objectContaining({ name: "onboarding-flow" }),
      ),
    );
  });

  it("goes straight to home when the requested family is already connected", () => {
    setup({
      getSelectedAccount: vi.fn(
        () => ethAccount,
      ) as unknown as CoreContext["getSelectedAccount"],
    });

    controller.navigationIntent("selectAccount", {
      name: "selectAccount",
      params: { family: "ethereum" },
    });

    expect(navigateToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "home" }),
    );
  });

  it("goes to home for a generic request when any account is connected", () => {
    setup({
      getActiveSelectedAccount: vi.fn(
        () => solAccount,
      ) as unknown as CoreContext["getActiveSelectedAccount"],
    });

    controller.navigationIntent("selectAccount", undefined);

    expect(navigateToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "home" }),
    );
  });

  it("opens onboarding for a generic request when nothing is connected", async () => {
    setup({
      getActiveSelectedAccount: vi.fn(
        () => undefined,
      ) as unknown as CoreContext["getActiveSelectedAccount"],
    });

    controller.navigationIntent("selectAccount", undefined);

    await vi.waitFor(() =>
      expect(navigateToSpy).toHaveBeenCalledWith(
        expect.objectContaining({ name: "onboarding-flow" }),
      ),
    );
  });
});
