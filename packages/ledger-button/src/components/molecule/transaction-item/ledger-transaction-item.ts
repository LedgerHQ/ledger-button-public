import "../../atom/icon/ledger-icon";

import { consume } from "@lit/context";
import { cva, cx } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import { tailwindElement } from "../../../tailwind-element.js";
import { formatFiatValue } from "../../../utils/format-fiat.js";

const transactionItemVariants = cva([
  "flex min-w-full items-center justify-between p-8",
  "bg-base-transparent transition duration-150 ease-in-out",
]);

const ALLOWED_EXPLORER_PROTOCOLS = new Set(["http:", "https:"]);

export type TransactionType = "sent" | "received";

export interface LedgerTransactionItemAttributes {
  type: TransactionType;
  title: string;
  timestamp: string;
  amount: string;
  ticker: string;
  fiatAmount: string;
  fiatCurrency: string;
  explorerUrl?: string;
  viewOnExplorerLabel?: string;
  hash?: string;
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
  fiatCurrency!: string;

  @property({ type: String, attribute: "locale" })
  locale!: string;

  @property({ type: String, attribute: "explorer-url" })
  explorerUrl?: string;

  @property({ type: String, attribute: "view-on-explorer-label" })
  viewOnExplorerLabel = "View on explorer";

  @property({ type: String })
  hash = "";

  @consume({ context: coreContext })
  @state()
  private readonly coreContext?: CoreContext;

  private readonly handleExplorerClick = () => {
    if (this.hash) {
      void this.coreContext?.trackViewTransactionDetailsClicked(this.hash);
    }
  };

  private get safeExplorerUrl(): string | undefined {
    if (!this.explorerUrl) {
      return undefined;
    }
    try {
      const parsed = new URL(this.explorerUrl);
      if (ALLOWED_EXPLORER_PROTOCOLS.has(parsed.protocol)) {
        return this.explorerUrl;
      }
    } catch {
      // Invalid URL
    }
    return undefined;
  }

  private get displayType(): string {
    return this.type === "received" ? "Received" : "Sent";
  }

  private get iconType(): "send" | "receive" {
    return this.type === "sent" ? "send" : "receive";
  }

  private get sign(): string {
    if (parseFloat(this.amount) === 0) return "";
    return this.type === "received" ? "+" : "-";
  }

  private get displayCryptoAmount(): string {
    return `${this.sign}${this.amount} ${this.ticker}`;
  }

  private get displayFiatAmount(): string {
    if (!this.fiatAmount || !this.fiatCurrency) {
      return "";
    }
    const formatted = formatFiatValue(
      this.fiatAmount,
      this.fiatCurrency,
      this.locale,
    );
    return `${this.sign}${formatted}`;
  }

  private renderLeftSection() {
    return html`
      <div class="flex items-center gap-12">
        <div
          class="bg-muted-transparent flex h-48 w-48 items-center justify-center rounded-full"
        >
          <ledger-icon
            type=${this.iconType}
            size="small"
            fillColor="currentColor"
            class="text-base"
          ></ledger-icon>
        </div>
        <div class="flex flex-col gap-4 text-left">
          <span class="body-2-semi-bold text-base">${this.title}</span>
          <span class="text-muted body-3"
            >${this.displayType} ${this.timestamp}</span
          >
        </div>
      </div>
    `;
  }

  private renderRightSection(interactive: boolean) {
    const amounts = html`
      <div
        class=${cx(
          "flex flex-col items-end justify-end gap-4 text-right",
          interactive && "group-hover:hidden group-focus-visible:hidden",
        )}
      >
        <span class="text-base body-2-semi-bold"
          >${this.displayFiatAmount}</span
        >
        <span class="text-muted body-3">${this.displayCryptoAmount}</span>
      </div>
    `;

    if (!interactive) {
      return amounts;
    }

    return html`
      ${amounts}
      <div
        class="hidden items-center gap-4 text-interactive body-3-semi-bold group-hover:flex group-focus-visible:flex"
      >
        <span>${this.viewOnExplorerLabel}</span>
        <ledger-icon
          type="externalLink"
          size="small"
          fillColor="currentColor"
        ></ledger-icon>
      </div>
    `;
  }

  override render() {
    const safeUrl = this.safeExplorerUrl;
    const interactive = !!safeUrl;
    const innerClasses = cx(
      transactionItemVariants(),
      interactive &&
        "group-hover:bg-muted-transparent group-focus-visible:bg-muted-transparent",
    );

    const inner = html`
      <div class=${innerClasses}>
        ${this.renderLeftSection()} ${this.renderRightSection(interactive)}
      </div>
    `;

    if (safeUrl) {
      return html`
        <a
          href=${safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="group flex min-w-full cursor-pointer flex-col overflow-hidden rounded-md text-inherit no-underline focus-visible:outline-none"
          @click=${this.handleExplorerClick}
        >
          ${inner}
        </a>
      `;
    }

    return html`
      <div class="flex min-w-full flex-col overflow-hidden rounded-md">
        ${inner}
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
