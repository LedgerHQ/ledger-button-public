import "../../atom/icon/ledger-icon";

import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";
import { formatFiatValue } from "../../../utils/format-fiat.js";

const transactionItemVariants = cva([
  "flex min-w-full items-center justify-between p-8",
  "bg-base-transparent transition duration-150 ease-in-out",
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
      <div class="flex items-center gap-12">
        <div
          class="flex h-48 w-48 items-center justify-center rounded-full bg-muted-transparent"
        >
          <ledger-icon
            type=${this.iconType}
            size="small"
            fillColor="currentColor"
            class="text-base"
          ></ledger-icon>
        </div>
        <div class="flex flex-col gap-4 text-left">
          <span class="text-base body-2-semi-bold">${this.title}</span>
          <span class="text-muted body-3"
            >${this.displayType} ${this.timestamp}</span
          >
        </div>
      </div>
    `;
  }

  private renderRightSection() {
    return html`
      <div
        class="flex flex-col items-end justify-end gap-4 text-right"
      >
        <span class="text-base body-2-semi-bold"
          >${this.displayFiatAmount}</span
        >
        <span class="text-muted body-3">${this.displayCryptoAmount}</span>
      </div>
    `;
  }

  override render() {
    return html`
      <div
        class="flex min-w-full flex-col overflow-hidden rounded-md"
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
