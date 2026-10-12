import type { Page } from "@playwright/test";

import type { DeviceMockServer } from "./DeviceMockServer";
import type { LedgerButtonApp } from "./LedgerButtonApp";
import { LEDGER_BUTTON_TEST_IDS } from "./test-ids";

/** Lets the screen intro animation settle before interacting with it. */
const SCREEN_ANIMATION_MS = 300;

/** Ledger Sync authentication + account retrieval on the mock device. */
const ACCOUNTS_RETRIEVAL_TIMEOUT = 90_000;

export type TrackingConsent = "accept" | "refuse";

export const FIRST_ONBOARDING_SCREENS = [
  LEDGER_BUTTON_TEST_IDS.welcomeContinue,
  LEDGER_BUTTON_TEST_IDS.consentRefuse,
  LEDGER_BUTTON_TEST_IDS.mockConnectionItem,
] as const;

/** Screens in onboarding order; a returning user may start further down. */
const ONBOARDING_SCREENS = [
  ...FIRST_ONBOARDING_SCREENS,
  LEDGER_BUTTON_TEST_IDS.accountCard,
] as const;

export type OnboardingScreen = (typeof ONBOARDING_SCREENS)[number];

/**
 * Drives the Ledger Button onboarding screens:
 * welcome → analytics consent → select device → Ledger Sync → select account
 * → connection success.
 */
export class OnboardingFlow {
  constructor(
    private readonly page: Page,
    private readonly app: LedgerButtonApp,
    private readonly deviceMockServer: DeviceMockServer,
  ) {}

  /**
   * Runs the whole onboarding from whichever screen is displayed, skipping
   * the screens already completed in the current browser profile, and
   * resolves with that first screen.
   */
  async completeWithMockDevice(
    consent: TrackingConsent = "refuse",
  ): Promise<OnboardingScreen> {
    await this.app.waitUntilMounted();
    this.deviceMockServer.startAutoApprover();

    const firstScreen = await this.app.waitForAnyTestId(
      ONBOARDING_SCREENS,
      20_000,
    );
    console.log(`── Onboarding: started on ${firstScreen} ──`);

    let screen: OnboardingScreen = firstScreen;
    if (screen === LEDGER_BUTTON_TEST_IDS.welcomeContinue) {
      await this.continueFromWelcome();
      screen = await this.app.waitForAnyTestId(ONBOARDING_SCREENS.slice(1));
    }
    if (screen === LEDGER_BUTTON_TEST_IDS.consentRefuse) {
      await this.answerConsent(consent);
      screen = await this.app.waitForAnyTestId(ONBOARDING_SCREENS.slice(2));
    }
    if (screen === LEDGER_BUTTON_TEST_IDS.mockConnectionItem) {
      await this.connectMockDevice();
    }

    await this.selectFirstAccount();
    await this.closeConnectionSuccess();
    return firstScreen;
  }

  async continueFromWelcome(): Promise<void> {
    await this.app.waitForTestId(LEDGER_BUTTON_TEST_IDS.welcomeContinue);
    await this.page.waitForTimeout(SCREEN_ANIMATION_MS);
    await this.app.clickByTestId(LEDGER_BUTTON_TEST_IDS.welcomeContinue);
    console.log("── Onboarding: welcome completed ──");
  }

  async answerConsent(consent: TrackingConsent): Promise<void> {
    const testId =
      consent === "accept"
        ? LEDGER_BUTTON_TEST_IDS.consentAccept
        : LEDGER_BUTTON_TEST_IDS.consentRefuse;
    await this.app.waitForTestId(testId);
    await this.app.clickByTestId(testId);
    console.log(`── Onboarding: consent answered (${consent}) ──`);
  }

  /**
   * Selects the "Mock Server" transport. Device prompts (Ledger Sync
   * activation…) are approved on Speculos by the auto-approver.
   */
  async connectMockDevice(): Promise<void> {
    await this.app.waitForTestId(LEDGER_BUTTON_TEST_IDS.mockConnectionItem);
    await this.app.clickByTestId(LEDGER_BUTTON_TEST_IDS.mockConnectionItem);
    console.log("── Onboarding: mock device selected ──");
  }

  async selectFirstAccount(): Promise<void> {
    await this.app.clickByTestIdWhenRendered(
      LEDGER_BUTTON_TEST_IDS.accountCard,
      ACCOUNTS_RETRIEVAL_TIMEOUT,
    );
    console.log("── Onboarding: first account selected ──");
  }

  async closeConnectionSuccess(): Promise<void> {
    await this.app.waitForTestId(
      LEDGER_BUTTON_TEST_IDS.connectionSuccessClose,
      30_000,
    );
    await this.app.clickByTestId(LEDGER_BUTTON_TEST_IDS.connectionSuccessClose);
    console.log("── Onboarding: connection success closed ──");
  }
}
