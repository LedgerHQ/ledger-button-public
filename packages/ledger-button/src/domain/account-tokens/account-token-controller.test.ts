import type { AccountWithFiat } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";

import type { Navigation } from "../../shared/navigation.js";
import { RootNavigationComponent } from "../../shared/root-navigation.js";
import { AccountTokenController } from "./account-token-controller.js";

function createAccount(overrides: Partial<AccountWithFiat> = {}): AccountWithFiat {
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

function createHost(): ReactiveControllerHost {
  return {
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  };
}

function createNavigation(hostOverrides: Partial<Navigation["host"]> = {}): Navigation {
  return {
    navigateBack: vi.fn(),
    navigateTo: vi.fn(),
    host: hostOverrides as Navigation["host"],
  } as unknown as Navigation;
}

describe("AccountTokenController", () => {
  describe("constructor", () => {
    it("initializes account to null when no staleAccount is provided", () => {
      const controller = new AccountTokenController(createHost(), createNavigation());

      expect(controller.account).toBeNull();
    });

    it("initializes account from staleAccount when provided", () => {
      const account = createAccount();
      const controller = new AccountTokenController(createHost(), createNavigation(), account);

      expect(controller.account).toBe(account);
    });
  });

  describe("hostConnected", () => {
    it("navigates back when account is null", () => {
      const navigation = createNavigation();
      const controller = new AccountTokenController(createHost(), navigation);

      controller.hostConnected();

      expect(navigation.navigateBack).toHaveBeenCalled();
    });

    it("does not navigate back when account is set", () => {
      const navigation = createNavigation();
      const controller = new AccountTokenController(createHost(), navigation, createAccount());

      controller.hostConnected();

      expect(navigation.navigateBack).not.toHaveBeenCalled();
    });
  });

  describe("handleConnect", () => {
    let windowDispatchEvent: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      windowDispatchEvent = vi.fn();
      Object.defineProperty(global, "window", {
        value: { dispatchEvent: windowDispatchEvent },
        writable: true,
        configurable: true,
      });
    });

    it("does nothing when account is null", () => {
      const controller = new AccountTokenController(createHost(), createNavigation());

      controller.handleConnect();

      expect(windowDispatchEvent).not.toHaveBeenCalled();
    });

    it("dispatches ledger-internal-account-selected event with account and success status", () => {
      const account = createAccount();
      const controller = new AccountTokenController(createHost(), createNavigation(), account);

      controller.handleConnect();

      expect(windowDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "ledger-internal-account-selected",
          detail: { account, status: "success" },
        }),
      );
    });

    it("calls selectAccount on the RootNavigationComponent host", () => {
      const account = createAccount();
      const rootNav = { selectAccount: vi.fn(), closeModal: vi.fn() } as unknown as RootNavigationComponent;
      Object.setPrototypeOf(rootNav, RootNavigationComponent.prototype);
      const navigation = createNavigation();
      navigation.host = rootNav;
      const controller = new AccountTokenController(createHost(), navigation, account);

      controller.handleConnect();

      expect(rootNav.selectAccount).toHaveBeenCalledWith(account);
    });

    it("calls closeModal on the RootNavigationComponent host", () => {
      const account = createAccount();
      const rootNav = { selectAccount: vi.fn(), closeModal: vi.fn() } as unknown as RootNavigationComponent;
      Object.setPrototypeOf(rootNav, RootNavigationComponent.prototype);
      const navigation = createNavigation();
      navigation.host = rootNav;
      const host = createHost();
      const controller = new AccountTokenController(host, navigation, account);

      controller.handleConnect();

      expect(rootNav.closeModal).toHaveBeenCalled();
    });
  });

  describe("selectAccount", () => {
    it("calls selectAccount on the RootNavigationComponent host", () => {
      const account = createAccount();
      const rootNav = { selectAccount: vi.fn(), closeModal: vi.fn() } as unknown as RootNavigationComponent;
      Object.setPrototypeOf(rootNav, RootNavigationComponent.prototype);
      const navigation = createNavigation();
      navigation.host = rootNav;
      const controller = new AccountTokenController(createHost(), navigation, account);

      controller.selectAccount(account);

      expect(rootNav.selectAccount).toHaveBeenCalledWith(account);
    });

    it("does not throw when host is not a RootNavigationComponent", () => {
      const account = createAccount();
      const navigation = createNavigation();
      const controller = new AccountTokenController(createHost(), navigation, account);

      expect(() => controller.selectAccount(account)).not.toThrow();
    });
  });

  describe("close", () => {
    it("calls closeModal and requestUpdate on the RootNavigationComponent host", () => {
      const account = createAccount();
      const rootNav = { selectAccount: vi.fn(), closeModal: vi.fn() } as unknown as RootNavigationComponent;
      Object.setPrototypeOf(rootNav, RootNavigationComponent.prototype);
      const navigation = createNavigation();
      navigation.host = rootNav;
      const host = createHost();
      const controller = new AccountTokenController(host, navigation, account);

      controller.close();

      expect(rootNav.closeModal).toHaveBeenCalled();
      expect(host.requestUpdate).toHaveBeenCalled();
    });

    it("does not throw when host is not a RootNavigationComponent", () => {
      const account = createAccount();
      const navigation = createNavigation();
      const controller = new AccountTokenController(createHost(), navigation, account);

      expect(() => controller.close()).not.toThrow();
    });
  });
});
