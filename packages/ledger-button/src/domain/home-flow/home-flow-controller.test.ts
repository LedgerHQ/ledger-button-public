import type { LedgerButtonCore } from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { BehaviorSubject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Navigation } from "../../shared/navigation";
import type { Destinations } from "../../shared/routes";
import { HomeFlowController } from "./home-flow-controller";

type TestContext = {
  hasTrackingConsent: boolean | undefined;
  selectedAccounts: Map<string, unknown>;
};

describe("HomeFlowController", () => {
  let host: ReactiveControllerHost;
  let navigation: Navigation;
  let destinations: Destinations;
  let contextSubject: BehaviorSubject<TestContext>;
  let core: LedgerButtonCore;
  let controller: HomeFlowController;

  beforeEach(() => {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };

    contextSubject = new BehaviorSubject<TestContext>({
      hasTrackingConsent: true,
      selectedAccounts: new Map(),
    });

    core = {
      observeContext: vi.fn().mockReturnValue(contextSubject.asObservable()),
    } as unknown as LedgerButtonCore;

    navigation = { navigateTo: vi.fn() } as unknown as Navigation;
    destinations = {
      onboardingFlow: { name: "onboarding-flow" },
    } as unknown as Destinations;

    controller = new HomeFlowController(host, core, navigation, destinations);
  });

  it("shows the consent screen when tracking consent is undefined", () => {
    contextSubject.next({
      hasTrackingConsent: undefined,
      selectedAccounts: new Map(),
    });

    controller.computeCurrentState();

    expect(controller.state).toBe("consent-analytics");
  });

  it("shows the home screen when any family has a selected account", () => {
    contextSubject.next({
      hasTrackingConsent: true,
      selectedAccounts: new Map([["solana", { freshAddress: "SoLaNa" }]]),
    });

    controller.computeCurrentState();

    expect(controller.state).toBe("ledger-home");
  });

  it("navigates to onboarding when no account is selected", () => {
    contextSubject.next({
      hasTrackingConsent: true,
      selectedAccounts: new Map(),
    });

    controller.computeCurrentState();

    expect(navigation.navigateTo).toHaveBeenCalledWith(
      destinations.onboardingFlow,
    );
  });
});
