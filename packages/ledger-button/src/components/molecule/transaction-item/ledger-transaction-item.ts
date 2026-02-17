import "../../atom/icon/ledger-icon";

import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";
import { formatFiatValue } from "../../../utils/format-fiat.js";

const transactionItemVariants = cva([
  "lb-flex lb-min-w-full lb-items-center lb-justify-between lb-p-8",
  "lb-bg-base-transparent lb-transition lb-duration-150 lb-ease-in-out",
]);

export type TransactionType = "sent" | "received";

export interface LedgerTransactionItemAttributes {
  type: TransactionType;
  title: string;
  timestamp: string;
  amount: string;
  ticker: string;
  fiatAmount: string;
  fiatCurrency: string;
}

@customElement("ledger-transaction-item")
@tailwindElement()
export class LedgerTransactionItem extends LitElement {
  @property({ type: String })
  type: TransactionType = "received";

  @property({ type: String })
  override title = "";

  @property({ type: String })
  timestamp = "";

  @property({ type: String })
  amount = "";

  @property({ type: String })
  ticker = "";

  @property({ type: String, attribute: "fiat-amount" })
  fiatAmount = "";

  @property({ type: String, attribute: "fiat-currency" })
  fiatCurrency = "$";

  private get containerClasses() {
    return {
      [transactionItemVariants()]: true,
    };
  }

  private get displayType(): string {
    return this.type === "received" ? "Received" : "Sent";
  }

  private get iconType(): "send" | "receive" {
    return this.type === "sent" ? "send" : "receive";
  }

  private get sign(): string {
    return this.type === "received" ? "+" : "-";
  }

  private get displayCryptoAmount(): string {
    return `${this.sign}${this.amount} ${this.ticker}`;
  }

  private get displayFiatAmount(): string {
    if (!this.fiatAmount || !this.fiatCurrency) {
      return "";
    }
    const formatted = formatFiatValue(this.fiatAmount, this.fiatCurrency);
    return `${this.sign}${formatted}`;
  }

  private renderLeftSection() {
    return html`
      <div class="lb-flex lb-items-center lb-gap-12">
        <div
          class="lb-flex lb-h-48 lb-w-48 lb-items-center lb-justify-center lb-rounded-full lb-bg-muted-transparent"
        >
          <ledger-icon
            type=${this.iconType}
            size="small"
            fillColor="currentColor"
            class="lb-text-base"
          ></ledger-icon>
        </div>
        <div class="lb-flex lb-flex-col lb-gap-4 lb-text-left">
          <span class="lb-text-base lb-body-2-semi-bold">${this.title}</span>
          <span class="lb-text-muted lb-body-3"
            >${this.displayType} ${this.timestamp}</span
          >
        </div>
      </div>
    `;
  }

  private renderRightSection() {
    return html`
      <div
        class="lb-flex lb-flex-col lb-items-end lb-justify-end lb-gap-4 lb-text-right"
      >
        <span class="lb-text-base lb-body-2-semi-bold"
          >${this.displayFiatAmount}</span
        >
        <span class="lb-text-muted lb-body-3">${this.displayCryptoAmount}</span>
      </div>
    `;
  }

  override render() {
    return html`
      <div
        class="lb-flex lb-min-w-full lb-flex-col lb-overflow-hidden lb-rounded-md"
      >
        <div class=${classMap(this.containerClasses)}>
          ${this.renderLeftSection()} ${this.renderRightSection()}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-transaction-item": LedgerTransactionItem;
  }
}

export default LedgerTransactionItem;
