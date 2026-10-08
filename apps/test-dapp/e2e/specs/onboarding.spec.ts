/**
 * Onboarding flow via Device Mock Server
 *
 * What it checks:
 *   1. A fresh profile goes through welcome → analytics consent → device selection.
 *   2. Welcome and consent are not shown again once completed.
 *   3. The full onboarding (mock device → Ledger Sync → account selection)
 *      exposes the selected EVM account to the dApp, then connecting the
 *      Solana wallet reuses that onboarding and exposes a Solana account.
 *
 * Prerequisites:
 *   - VPN / office network access to the Device Mock Server.
 *   - Each test gets its own DMS session and a wiped browser profile.
 */

import { expect, test } from "../helpers/fixtures";
import { FIRST_ONBOARDING_SCREENS } from "../helpers/OnboardingFlow";
import { LEDGER_BUTTON_TEST_IDS } from "../helpers/test-ids";

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

test.describe("Onboarding via Device Mock Server", () => {
  test("a first-time user sees welcome, then analytics consent, then device selection", async ({
    testDapp,
    ledgerButtonApp,
    onboardingFlow,
  }) => {
    await testDapp.open();
    await testDapp.selectLedgerProvider();
    await ledgerButtonApp.waitUntilMounted();

    expect(
      await ledgerButtonApp.waitForAnyTestId(FIRST_ONBOARDING_SCREENS, 20_000),
    ).toBe(LEDGER_BUTTON_TEST_IDS.welcomeContinue);

    await onboardingFlow.continueFromWelcome();
    await ledgerButtonApp.waitForTestId(LEDGER_BUTTON_TEST_IDS.consentAccept);
    expect(
      await ledgerButtonApp.isTestIdRendered(
        LEDGER_BUTTON_TEST_IDS.consentRefuse,
      ),
    ).toBe(true);

    await onboardingFlow.answerConsent("accept");
    await ledgerButtonApp.waitForTestId(
      LEDGER_BUTTON_TEST_IDS.mockConnectionItem,
    );
    await expect
      .poll(() =>
        ledgerButtonApp.isTestIdRendered(LEDGER_BUTTON_TEST_IDS.consentAccept),
      )
      .toBe(false);
  });

  test("a returning user skips welcome and analytics consent", async ({
    testDapp,
    ledgerButtonApp,
    onboardingFlow,
  }) => {
    await testDapp.open();
    await testDapp.selectLedgerProvider();
    await ledgerButtonApp.waitUntilMounted();
    await onboardingFlow.continueFromWelcome();
    await onboardingFlow.answerConsent("refuse");
    await ledgerButtonApp.waitForTestId(
      LEDGER_BUTTON_TEST_IDS.mockConnectionItem,
    );
    await ledgerButtonApp.waitForPersistedOnboardingProgress();

    await testDapp.reload();
    await testDapp.selectLedgerProvider();
    await ledgerButtonApp.waitUntilMounted();

    await ledgerButtonApp.waitForTestId(
      LEDGER_BUTTON_TEST_IDS.mockConnectionItem,
      20_000,
    );
    expect(
      await ledgerButtonApp.isTestIdRendered(
        LEDGER_BUTTON_TEST_IDS.welcomeContinue,
      ),
    ).toBe(false);
    expect(
      await ledgerButtonApp.isTestIdRendered(
        LEDGER_BUTTON_TEST_IDS.consentRefuse,
      ),
    ).toBe(false);
  });

  test("onboarding connects an EVM account, then a Solana account without onboarding again", async ({
    testDapp,
    ledgerButtonApp,
    onboardingFlow,
  }) => {
    await test.step("EVM: full onboarding from a fresh profile", async () => {
      await testDapp.open();
      await testDapp.selectLedgerProvider();

      expect(await onboardingFlow.completeWithMockDevice()).toBe(
        LEDGER_BUTTON_TEST_IDS.welcomeContinue,
      );

      await expectModalClosed();
      await expect(testDapp.connectedAccount).toHaveText(EVM_ADDRESS, {
        timeout: 15_000,
      });
    });

    await test.step("Solana: Ledger Sync is reused, straight to account selection", async () => {
      await testDapp.open("/solana");
      await testDapp.connectLedgerSolanaWallet();

      expect(await onboardingFlow.completeWithMockDevice()).toBe(
        LEDGER_BUTTON_TEST_IDS.accountCard,
      );

      await expectModalClosed();
      await expect(testDapp.connectedSolanaPublicKey).toHaveText(
        SOLANA_ADDRESS,
        { timeout: 15_000 },
      );
    });

    async function expectModalClosed(): Promise<void> {
      await expect
        .poll(() =>
          ledgerButtonApp.isTestIdRendered(
            LEDGER_BUTTON_TEST_IDS.connectionSuccessClose,
          ),
        )
        .toBe(false);
    }
  });
});
