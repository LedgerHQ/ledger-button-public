import type { AccountWithFiat } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { of, Subject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreContext } from "../../context/core-context.js";
import type { Navigation } from "../../shared/navigation.js";
import { RootNavigationComponent } from "../../shared/root-navigation.js";
import { AvailableNetworksController } from "./available-networks-controller.js";

vi.mock("../../shared/root-navigation.js", () => {
  class MockRootNavigationComponent {
    selectAccount = vi.fn();
    navigateToHome = vi.fn();
  }
  return { RootNavigationComponent: MockRootNavigationComponent };
});

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
    name: "Ethereum",
    ticker: "ETH",
    balance: "1.5",
    tokens: [],
    fiatBalance: { value: "3000.00", currency: "USD" },
    fiatError: false,
    balanceLoadingState: "loaded",
    fiatLoadingState: "loaded",
    ...overrides,
  };
}

const ethAccount = createAccount({
  id: "eth-1",
  currencyId: "ethereum",
  balance: "1.5",
  fiatBalance: { value: "3000.00", currency: "USD" },
});

const polygonAccount = createAccount({
  id: "polygon-1",
  currencyId: "polygon",
  balance: "200",
  ticker: "MATIC",
  fiatBalance: { value: "500.00", currency: "USD" },
});

const otherAddressAccount = createAccount({
  id: "bsc-1",
  currencyId: "bsc",
  freshAddress: "0xdifferent",
});

describe("AvailableNetworksController", () => {
  let controller: AvailableNetworksController;
  let host: ReactiveControllerHost;
  let core: CoreContext;
  let navigation: Navigation;

  beforeEach(() => {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };

    core = {
      observeContext: vi
        .fn()
        .mockReturnValue(of({ selectedAccounts: new Map([["ethereum", { freshAddress: "0xabc123" }]]) })),
      observeAccounts: vi
        .fn()
        .mockReturnValue(of([ethAccount, polygonAccount, otherAddressAccount])),
      getCurrencyInfo: vi.fn().mockImplementation((currencyId: string) => {
        const map: Record<string, { name: string; ticker: string }> = {
          ethereum: { name: "Ethereum", ticker: "ETH" },
          polygon: { name: "Polygon", ticker: "MATIC" },
        };
        return Promise.resolve(
          map[currencyId] ?? { name: currencyId, ticker: currencyId },
        );
      }),
    } as unknown as CoreContext;

    navigation = {
      navigateBack: vi.fn(),
      host: {},
    } as unknown as Navigation;

    controller = new AvailableNetworksController(host, core, navigation);
  });

  async function connectAndWaitForLoad() {
    controller.hostConnected();
    await vi.waitFor(() => expect(controller.loading).toBe(false));
  }

  it("should load networks for the selected address sorted by fiat value", async () => {
    await connectAndWaitForLoad();

    expect(controller.networks).toEqual([
      expect.objectContaining({
        id: "ethereum",
        name: "Ethereum",
        balance: "1.5",
      }),
      expect.objectContaining({
        id: "polygon",
        name: "Polygon",
        balance: "200",
      }),
    ]);
  });

  it("should exclude accounts with a different address", async () => {
    await connectAndWaitForLoad();

    expect(controller.networks.map((n) => n.id)).not.toContain("bsc");
  });

  it("should navigate back when no selected address", async () => {
    (core.observeContext as ReturnType<typeof vi.fn>).mockReturnValue(
      of({ selectedAccounts: new Map() }),
    );

    controller.hostConnected();
    await vi.waitFor(() => expect(navigation.navigateBack).toHaveBeenCalled());
  });

  it("should select the matching account and navigate home", async () => {
    const mockHost = new (RootNavigationComponent as new () => InstanceType<
      typeof RootNavigationComponent
    >)();
    navigation.host = mockHost as unknown as Navigation["host"];

    await connectAndWaitForLoad();
    controller.selectNetwork("polygon");

    expect(mockHost.selectAccount).toHaveBeenCalledWith(polygonAccount);
    expect(mockHost.navigateToHome).toHaveBeenCalled();
  });

  it("should stay loading until subscription completes", async () => {
    const subject = new Subject<AccountWithFiat[]>();
    (core.observeAccounts as ReturnType<typeof vi.fn>).mockReturnValue(subject);

    controller.hostConnected();
    await vi.waitFor(() => expect(core.observeAccounts).toHaveBeenCalled());

    subject.next([ethAccount, polygonAccount]);
    expect(controller.loading).toBe(true);

    subject.next([ethAccount, polygonAccount]);
    expect(controller.loading).toBe(true);

    subject.complete();
    await vi.waitFor(() => expect(controller.loading).toBe(false));

    expect(controller.networks).toHaveLength(2);
  });

  it("should not select when network id is unknown", async () => {
    const mockHost = new (RootNavigationComponent as new () => InstanceType<
      typeof RootNavigationComponent
    >)();
    navigation.host = mockHost as unknown as Navigation["host"];

    await connectAndWaitForLoad();
    controller.selectNetwork("unknown");

    expect(mockHost.selectAccount).not.toHaveBeenCalled();
  });
});
