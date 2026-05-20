import "./ledger-transaction-notifications.js";

import { consume } from "@lit/context";
import { html, LitElement, nothing } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { tailwindElement } from "../../../tailwind-element.js";
import type { TransactionConfirmationNotification } from "../../../types/transaction-confirmation-notification.js";
import type { LedgerTransactionNotifications } from "./ledger-transaction-notifications.js";
import { TransactionConfirmationNotifier } from "./transaction-confirmation-notifier.js";

@customElement("ledger-transaction-confirmation-host")
@tailwindElement()
export class LedgerTransactionConfirmationHost extends LitElement {
  @consume({ context: coreContext })
  @property({ attribute: false })
  public core!: CoreContext;

  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  @property({ type: String, attribute: "confirmation-mode" })
  confirmationMode: TransactionConfirmationNotification = "tooltip";

  @query("ledger-transaction-notifications")
  private notificationsEl!: LedgerTransactionNotifications;

  private notifier: TransactionConfirmationNotifier | undefined;

  override updated(): void {
    this.syncNotifier();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.notifier?.stop();
    this.notifier = undefined;
  }

  private syncNotifier(): void {
    if (
      this.confirmationMode !== "toast" ||
      !this.notificationsEl ||
      !this.core
    ) {
      this.notifier?.stop();
      this.notifier = undefined;
      return;
    }

    if (!this.notifier) {
      this.notifier = new TransactionConfirmationNotifier(
        this.core,
        this.notificationsEl,
        () => this.getI18n(),
      );
      this.notifier.start();
    }
  }

  private getI18n() {
    const tx =
      this.languages?.currentTranslation?.common?.transactionConfirmation;
    return {
      transactionConfirmedTitle:
        tx?.transactionConfirmedTitle ?? "Transaction confirmed",
      transactionFailedTitle:
        tx?.transactionFailedTitle ?? "Transaction failed",
      checkOnExplorer: tx?.checkOnExplorer ?? "Check transaction on explorer",
    };
  }

  override render() {
    console.log("render", this.confirmationMode);
    if (this.confirmationMode !== "toast") {
      return nothing;
    }

    return html`<ledger-transaction-notifications></ledger-transaction-notifications>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-transaction-confirmation-host": LedgerTransactionConfirmationHost;
  }
}

export default LedgerTransactionConfirmationHost;
