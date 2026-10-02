import type { Network } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { of, Subject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoreContext } from "../../context/core-context";
import type { Navigation } from "../../shared/navigation";
import { RootNavigationComponent } from "../../shared/root-navigation";
import { AvailableNetworksController } from "./available-networks-controller";

vi.mock("../../shared/root-navigation", () => {
  class MockRootNavigationComponent {
    selectAccount = vi.fn();
    navigateToHome = vi.fn();
  }
  return { RootNavigationComponent: MockRootNavigationComponent };
});

const ethereumNetwork: Network = {
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  balance: "1.5",
  fiatBalance: { value: "3000.00", currency: "USD" },
  totalFiatBalance: { value: "3000.00", currency: "USD" },
};

const polygonNetwork: Network = {
  id: "polygon",
  name: "Polygon",
  ticker: "MATIC",
  balance: "200",
  fiatBalance: { value: "500.00", currency: "USD" },
  totalFiatBalance: { value: "500.00", currency: "USD" },
};

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
      observeNetworksForSelectedAddress: vi
        .fn()
        .mockReturnValue(of([ethereumNetwork, polygonNetwork])),
      selectAccountForNetwork: vi.fn().mockReturnValue(true),
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

  it("should expose the networks emitted by the core, in order", async () => {
    await connectAndWaitForLoad();

    expect(controller.networks).toEqual([ethereumNetwork, polygonNetwork]);
  });

  it("should navigate back when the core emits no network", async () => {
    (
      core.observeNetworksForSelectedAddress as ReturnType<typeof vi.fn>
    ).mockReturnValue(of([]));

    controller.hostConnected();

    await vi.waitFor(() => expect(navigation.navigateBack).toHaveBeenCalled());
    expect(controller.loading).toBe(true);
  });

  it("should stay loading until the core emits", async () => {
    const networks$ = new Subject<Network[]>();
    (
      core.observeNetworksForSelectedAddress as ReturnType<typeof vi.fn>
    ).mockReturnValue(networks$);

    controller.hostConnected();
    expect(controller.loading).toBe(true);

    networks$.next([ethereumNetwork]);

    expect(controller.loading).toBe(false);
    expect(controller.networks).toEqual([ethereumNetwork]);
  });

  it("should keep reflecting later emissions", async () => {
    const networks$ = new Subject<Network[]>();
    (
      core.observeNetworksForSelectedAddress as ReturnType<typeof vi.fn>
    ).mockReturnValue(networks$);

    controller.hostConnected();
    networks$.next([ethereumNetwork]);
    networks$.next([ethereumNetwork, polygonNetwork]);

    expect(controller.networks).toHaveLength(2);
  });

  it("should delegate the account switch to the core and navigate home", async () => {
    const mockHost = new (RootNavigationComponent as new () => InstanceType<
      typeof RootNavigationComponent
    >)();
    navigation.host = mockHost as unknown as Navigation["host"];

    await connectAndWaitForLoad();
    controller.selectNetwork("polygon");

    expect(core.selectAccountForNetwork).toHaveBeenCalledWith("polygon");
    expect(mockHost.navigateToHome).toHaveBeenCalled();
  });

  it("should not navigate when the core has no account for that network", async () => {
    const mockHost = new (RootNavigationComponent as new () => InstanceType<
      typeof RootNavigationComponent
    >)();
    navigation.host = mockHost as unknown as Navigation["host"];
    (
      core.selectAccountForNetwork as ReturnType<typeof vi.fn>
    ).mockReturnValue(false);

    await connectAndWaitForLoad();
    controller.selectNetwork("unknown");

    expect(mockHost.navigateToHome).not.toHaveBeenCalled();
  });

  it("should unsubscribe on disconnect", async () => {
    const networks$ = new Subject<Network[]>();
    (
      core.observeNetworksForSelectedAddress as ReturnType<typeof vi.fn>
    ).mockReturnValue(networks$);

    controller.hostConnected();
    expect(networks$.observed).toBe(true);

    controller.hostDisconnected();
    expect(networks$.observed).toBe(false);
  });
});
