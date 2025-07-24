import "@ledgerhq/ledger-button-ui";
import "./context/core-context.js";
import "./context/language-context.js";
import "./ledger-button-app.js";
import "./domain/onboarding/sign-transaction/sign-transaction.js";

import { TransactionData } from "@ledgerhq/ledger-button-core";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ledger-button-playground")
export class LedgerButtonPlayground extends LitElement {
  @property({ type: String })
  demoMode: "onboarding" | "signTransaction" = "onboarding";

  @property({ type: Object })
  transactionData?: TransactionData;

  private renderOnboardingDemo() {
    return html`
      <core-provider>
        <language-provider>
          <ledger-button-app></ledger-button-app>
        </language-provider>
      </core-provider>
    `;
  }

  private renderSignTransactionDemo() {
    const mockDestinations = {
      home: {
        name: "home",
        component: "lb-home",
        canGoBack: false,
        toolbar: { title: "Home", showClose: true, showLogo: true },
      },
      onboarding: {
        name: "onboarding",
        component: "select-device-screen",
        canGoBack: false,
        toolbar: { title: "Connect Device", showClose: true, showLogo: true },
      },
      signTransaction: {
        name: "sign-transaction",
        component: "sign-transaction-screen",
        canGoBack: true,
        toolbar: { title: "Sign Transaction", showClose: true, showLogo: true },
      },
      fetchAccounts: {
        name: "retrieving-accounts",
        component: "retrieving-accounts-screen",
        canGoBack: false,
        toolbar: {
          title: "Retrieving Accounts",
          showClose: false,
          showLogo: true,
        },
      },
      selectAccount: {
        name: "select-account",
        component: "select-account-screen",
        canGoBack: false,
        toolbar: { title: "Select Account", showClose: true, showLogo: true },
      },
      ledgerSync: {
        name: "ledger-sync",
        component: "ledger-sync-screen",
        canGoBack: true,
        toolbar: { title: "Ledger Sync", showClose: true, showLogo: true },
      },
      notFound: {
        name: "not-found",
        component: "ledger-button-404",
        canGoBack: false,
        toolbar: { title: "404", showClose: true, showLogo: true },
      },
    };

    const mockNavigation = {
      navigateTo: (destination: any) =>
        console.log("Navigate to:", destination.name),
      currentScreen: mockDestinations.signTransaction,
    };

    return html`
      <core-provider>
        <language-provider>
          <div class="bg-gray-900 mx-auto max-w-md rounded-xl p-16">
            <div class="mb-16 text-center">
              <h2 class="text-lg font-semibold mb-8 text-white">
                Sign Transaction Demo
              </h2>
              <p class="text-gray-400 text-sm">
                This demo shows the sign transaction flow with real transaction
                data
              </p>
            </div>
            <sign-transaction-screen
              .transactionData=${this.transactionData}
              .navigation=${mockNavigation}
              .destinations=${mockDestinations}
              deviceModel="stax"
              state="signing"
            ></sign-transaction-screen>
          </div>
        </language-provider>
      </core-provider>
    `;
  }

  override render() {
    switch (this.demoMode) {
      case "signTransaction":
        return this.renderSignTransactionDemo();
      case "onboarding":
      default:
        return this.renderOnboardingDemo();
    }
  }
}
