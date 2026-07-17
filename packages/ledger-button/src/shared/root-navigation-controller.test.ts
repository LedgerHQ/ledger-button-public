import type { Account } from "@ledgerhq/ledger-wallet-provider-core";
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

vi.mock("./routes.js", () => ({
  makeDestinations: () => ({
    home: { name: "home" },
    onboardingFlow: { name: "onboarding-flow" },
    mobileOnboarding: { name: "mobile-onboarding" },
    signingFlow: { name: "signing-flow" },
  }),
  resolveCanGoBack: vi.fn().mockReturnValue(false),
}));

vi.mock("../context/language-context.js", () => ({
  LanguageContext: { LANGUAGE_CHANGE: "language-change" },
}));

const ethAccount = {
  freshAddress: "0xabc123",
  currencyId: "ethereum",
} as unknown as Account;

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
    };

    core = {
      getActiveSelectedAccount: vi.fn().mockReturnValue(ethAccount),
      isMobile: vi.fn().mockReturnValue(false),
      getConnectedDevice: vi.fn(),
      observeContext: vi.fn(),
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
