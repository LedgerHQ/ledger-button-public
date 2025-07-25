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
    return html`
      <core-provider .transactionData=${this.transactionData}>
        <language-provider>
          <ledger-button-app></ledger-button-app>
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
