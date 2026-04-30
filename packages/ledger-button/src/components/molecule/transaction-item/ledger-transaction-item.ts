import "../../atom/icon/ledger-icon";

import { consume } from "@lit/context";
import { cva, cx } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { tailwindElement } from "../../../tailwind-element.js";
import { formatFiatValue } from "../../../utils/format-fiat.js";

const transactionItemVariants = cva([
  "flex min-w-full items-center justify-between p-8",
  "bg-base-transparent transition duration-150 ease-in-out",
]);

const ALLOWED_EXPLORER_PROTOCOLS = new Set(["http:", "https:"]);

export type TransactionType = "sent" | "received";
export type TransactionStatus = "confirmed" | "failed" | "pending";
export type TransactionKind =
  | "transfer"
  | "swap"
  | "approve"
  | "contract"
  | "fees"
  | "unknown";

export interface LedgerTransactionItemAttributes {
  type: TransactionType;
  status: TransactionStatus;
  kind: TransactionKind;
  title: string;
  timestamp: string;
  amount: string;
  ticker: string;
  fiatAmount: string;
  fiatCurrency: string;
  explorerUrl?: string;
  viewOnExplorerLabel?: string;
  hash?: string;
  formattedFee?: string;
  feeTicker?: string;
}

@customElement("ledger-transaction-item")
@tailwindElement()
export class LedgerTransactionItem extends LitElement {
  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages?: LanguageContext;

  @property({ type: String })
  type: TransactionType = "received";

  @property({ type: String })
  status: TransactionStatus = "confirmed";

  @property({ type: String })
  kind: TransactionKind = "transfer";

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
  @property({ type: String, attribute: "formatted-fee" })
  formattedFee = "";

  @property({ type: String, attribute: "fee-ticker" })
  feeTicker = "";

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

  private get translations() {
    return this.languages?.currentTranslation;
  }

  private get isFailed(): boolean {
    return this.status === "failed";
  }

  private get isFeesKind(): boolean {
    return this.kind === "fees";
  }

  private get isFeesRow(): boolean {
    return this.isFeesKind && !!this.formattedFee;
  }

  private get transactionListLabels(): {
    failed?: string;
    kinds?: {
      swap?: string;
      approve?: string;
      contract?: string;
      fees?: string;
    };
  } {
    return this.translations?.transactionList ?? {};
  }

  private get displayType(): string {
    const kindLabels = this.transactionListLabels.kinds;
    if (this.isFeesRow) {
      return kindLabels?.fees ?? "Fees";
    }
    if (this.isFailed) {
      return this.transactionListLabels.failed ?? "Failed";
    }
    switch (this.kind) {
      case "swap":
        return kindLabels?.swap ?? "Swap";
      case "approve":
        return kindLabels?.approve ?? "Approve";
      case "contract":
        return kindLabels?.contract ?? "Contract interaction";
      case "fees":
        return kindLabels?.fees ?? "Fees";
      case "transfer":
      case "unknown":
      default:
        return this.type === "received" ? "Received" : "Sent";
    }
  }

  private get iconType(): "send" | "receive" | "coins" {
    if (this.kind === "fees") return "coins";
    if (this.kind === "swap") return "send";
    return this.type === "sent" ? "send" : "receive";
  }

  private get iconSpotClasses() {
    const showFailed = this.isFailed && !this.isFeesRow;
    return {
      "flex h-48 w-48 items-center justify-center rounded-full": true,
      "bg-error": showFailed,
      "bg-muted-transparent": !showFailed,
    };
  }

  private get iconColorClasses() {
    const showFailed = this.isFailed && !this.isFeesRow;
    return {
      "text-error": showFailed,
      "text-base": !showFailed,
    };
  }

  private get subLabelTime(): string {
    if (this.isFailed || this.isFeesKind) {
      return `- ${this.timestamp}`;
    }
    return this.timestamp;
  }

  private get sign(): string {
    if (parseFloat(this.amount) === 0 && !this.isFeesRow) return "";
    return this.type === "received" ? "+" : "-";
  }

  private get displayCryptoAmount(): string {
    if (this.isFeesRow) {
      const ticker = this.feeTicker || this.ticker;
      return `-${this.formattedFee} ${ticker}`.trimEnd();
    }
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
    const sign = parseFloat(this.fiatAmount) === 0 ? "" : this.sign;
    return `${sign}${formatted}`;
  }

  private renderLeftSection() {
    return html`
      <div class="flex items-center gap-12">
        <div class=${classMap(this.iconSpotClasses)}>
          <ledger-icon
            type=${this.iconType}
            size="small"
            fillColor="currentColor"
            class=${classMap(this.iconColorClasses)}
          ></ledger-icon>
        </div>
        <div class="flex flex-col gap-4 text-left">
          <span class="text-base body-2-semi-bold">${this.title}</span>
          <span class="flex items-center gap-4 text-muted body-3">
            ${this.displayType} ${this.subLabelTime}
          </span>
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
        <span class="body-2-semi-bold text-base"
          >${this.displayCryptoAmount}</span
        >
        <span class="text-muted body-3">${this.displayFiatAmount}</span>
      </div>
    `;

    if (!interactive) {
      return amounts;
    }

    return html`
      ${amounts}
      <div
        class="text-interactive body-3-semi-bold hidden items-center gap-4 group-hover:flex group-focus-visible:flex"
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
