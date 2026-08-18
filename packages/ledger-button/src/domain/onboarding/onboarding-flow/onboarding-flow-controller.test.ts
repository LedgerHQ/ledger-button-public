import type {
  ButtonCoreContext,
  Device,
  LedgerButtonCore,
} from "@ledgerhq/ledger-wallet-provider-core";
import type { ReactiveControllerHost } from "lit";
import { BehaviorSubject } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingFlowController } from "./onboarding-flow-controller";

function createMockContext(
  overrides: Partial<ButtonCoreContext> = {},
): ButtonCoreContext {
  return {
    connectedDevice: undefined,
    selectedAccounts: new Map(),
    activeFamily: undefined,
    trustChainId: undefined,
    applicationPath: undefined,
    chainId: 1,
    welcomeScreenCompleted: false,
    hasTrackingConsent: undefined,
    hasDeveloperMode: false,
    isMobilePlatform: false,
    preferredFiatCurrency: "usd",
    ...overrides,
  };
}

describe("OnboardingFlowController", () => {
  let controller: OnboardingFlowController;
  let host: ReactiveControllerHost;
  let contextSubject: BehaviorSubject<ButtonCoreContext>;
  let mockCore: { observeContext: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    host = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
      updateComplete: Promise.resolve(true),
    };

    contextSubject = new BehaviorSubject<ButtonCoreContext>(
      createMockContext(),
    );
    mockCore = {
      observeContext: vi.fn().mockReturnValue(contextSubject.asObservable()),
    };

    controller = new OnboardingFlowController(
      host,
      mockCore as unknown as LedgerButtonCore,
    );
  });

  afterEach(() => {
    contextSubject.complete();
  });

  describe("mobile-onboarding state", () => {
    it("should enter mobile-onboarding when isMobilePlatform is true", () => {
      controller.computeCurrentState();
      contextSubject.next(createMockContext({ isMobilePlatform: true }));

      expect(controller.state).toBe("mobile-onboarding");
    });

    it("should prioritize mobile-onboarding over welcome screen", () => {
      controller.computeCurrentState();
      contextSubject.next(
        createMockContext({
          isMobilePlatform: true,
          welcomeScreenCompleted: false,
        }),
      );

      expect(controller.state).toBe("mobile-onboarding");
    });

    it("should prioritize mobile-onboarding over consent-analytics", () => {
      controller.computeCurrentState();
      contextSubject.next(
        createMockContext({
          isMobilePlatform: true,
          welcomeScreenCompleted: true,
          hasTrackingConsent: undefined,
        }),
      );

      expect(controller.state).toBe("mobile-onboarding");
    });

    it("should prioritize mobile-onboarding over select-device", () => {
      controller.computeCurrentState();
      contextSubject.next(
        createMockContext({
          isMobilePlatform: true,
          welcomeScreenCompleted: true,
          hasTrackingConsent: true,
        }),
      );

      expect(controller.state).toBe("mobile-onboarding");
    });
  });

  describe("desktop flow states", () => {
    it("should enter welcome when welcomeScreenCompleted is false", () => {
      controller.computeCurrentState();
      contextSubject.next(createMockContext({ welcomeScreenCompleted: false }));

      expect(controller.state).toBe("welcome");
    });

    it("should enter consent-analytics when hasTrackingConsent is undefined", () => {
      controller.computeCurrentState();
      contextSubject.next(
        createMockContext({
          welcomeScreenCompleted: true,
          hasTrackingConsent: undefined,
        }),
      );

      expect(controller.state).toBe("consent-analytics");
    });

    it("should enter retrieving-accounts when trustChainId and applicationPath are set", () => {
      controller.computeCurrentState();
      contextSubject.next(
        createMockContext({
          welcomeScreenCompleted: true,
          hasTrackingConsent: true,
          trustChainId: "tc-123",
          applicationPath: "/app/path",
        }),
      );

      expect(controller.state).toBe("retrieving-accounts");
    });

    it("should enter ledger-sync when trustChainId is set without applicationPath", () => {
      controller.computeCurrentState();
      contextSubject.next(
        createMockContext({
          welcomeScreenCompleted: true,
          hasTrackingConsent: true,
          trustChainId: "tc-123",
          applicationPath: undefined,
        }),
      );

      expect(controller.state).toBe("ledger-sync");
    });

    it("should enter ledger-sync when device is connected", () => {
      controller.computeCurrentState();
      contextSubject.next(
        createMockContext({
          welcomeScreenCompleted: true,
          hasTrackingConsent: true,
          connectedDevice: {
            id: "device-1",
          } as unknown as Device,
        }),
      );

      expect(controller.state).toBe("ledger-sync");
    });

    it("should enter select-device as fallback", () => {
      controller.computeCurrentState();
      contextSubject.next(
        createMockContext({
          welcomeScreenCompleted: true,
          hasTrackingConsent: true,
        }),
      );

      expect(controller.state).toBe("select-device");
    });
  });

  describe("lifecycle", () => {
    it("should request host update on hostConnected", () => {
      controller.hostConnected();

      expect(host.requestUpdate).toHaveBeenCalled();
    });

    it("should unsubscribe on hostDisconnected", () => {
      controller.computeCurrentState();
      expect(controller.contextSubscription).toBeDefined();

      controller.hostDisconnected();

      expect(controller.contextSubscription!.closed).toBe(true);
    });

    it("should unsubscribe previous subscription when computeCurrentState is called again", () => {
      controller.computeCurrentState();
      const firstSubscription = controller.contextSubscription;

      controller.computeCurrentState();

      expect(firstSubscription!.closed).toBe(true);
      expect(controller.contextSubscription!.closed).toBe(false);
    });
  });
});
