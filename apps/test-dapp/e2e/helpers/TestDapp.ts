import { expect, type Locator, type Page } from "@playwright/test";

import type { MockServerSession } from "./DeviceMockServer";
import {
  DAPP_TEST_IDS,
  LEDGER_PROVIDER_RDNS,
  LEDGER_SOLANA_WALLET_NAME,
} from "./test-ids";

const IGNORED_BROWSER_LOGS = ["React DevTools", "Lit is in dev mode"];

export type DappRoute = "/" | "/solana";

/**
 * Page object for the test dApp: the EVM home page and the Solana page.
 */
export class TestDapp {
  constructor(private readonly page: Page) {}

  /**
   * Injects the Device Mock Server session in localStorage before any page
   * script runs, so the provider initializes with the mock transport and the
   * select-device screen offers the "Mock Server" connection item.
   */
  async useMockServerSession(session: MockServerSession): Promise<void> {
    await this.page.addInitScript(
      ({ token, deviceId }: MockServerSession) => {
        localStorage.setItem("MOCK_SERVER_TOKEN", token);
        localStorage.setItem("MOCK_SERVER_DEVICE_ID", deviceId);
        localStorage.setItem("LEDGER_ENVIRONMENT", "staging");
      },
      session,
    );
  }

  forwardBrowserLogs(): void {
    this.page.on("console", (message) => {
      const text = message.text();
      if (
        message.type() === "endGroup" ||
        IGNORED_BROWSER_LOGS.some((ignored) => text.includes(ignored))
      ) {
        return;
      }
      console.log(`  [browser:${message.type()}] ${text}`);
    });
    this.page.on("pageerror", (error) =>
      console.error(`  [browser:pageerror] ${error.message}`),
    );
  }

  async open(route: DappRoute = "/"): Promise<void> {
    await this.page.goto(route);
    await this.waitForProviderReady();
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForProviderReady();
  }

  /**
   * Discovers EIP-6963 providers and selects Ledger Wallet, which requests
   * accounts and therefore opens the Ledger Button modal.
   */
  async selectLedgerProvider(): Promise<void> {
    await this.page.getByRole("button", { name: /discover providers/i }).click();

    const providerCard = this.page.getByTestId(
      DAPP_TEST_IDS.providerCard(LEDGER_PROVIDER_RDNS),
    );
    await providerCard.waitFor({ state: "visible", timeout: 15_000 });
    await providerCard.click();
  }

  /**
   * Connects the Ledger wallet registered through Wallet Standard on the
   * Solana page, which opens the Ledger Button modal.
   */
  async connectLedgerSolanaWallet(): Promise<void> {
    const walletRow = this.page.getByTestId(
      DAPP_TEST_IDS.solanaWalletRow(LEDGER_SOLANA_WALLET_NAME),
    );
    await walletRow.waitFor({ state: "visible", timeout: 15_000 });
    await walletRow.getByRole("button", { name: /^connect$/i }).click();
  }

  get connectedAccount(): Locator {
    return this.page.getByTestId(DAPP_TEST_IDS.connectedAccount);
  }

  get connectedSolanaPublicKey(): Locator {
    return this.page.getByTestId(DAPP_TEST_IDS.connectedSolanaPublicKey);
  }

  /**
   * Once the stored mock session is confirmed alive, the dApp reinitializes
   * the Ledger Button; opening the modal before that would hit a core that is
   * about to be replaced and still holds the default (fresh user) context.
   */
  private async waitForProviderReady(): Promise<void> {
    await expect(
      this.page.getByTestId(DAPP_TEST_IDS.mockServerConnected),
    ).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText("Initializing provider")).toBeHidden({
      timeout: 15_000,
    });
  }
}
