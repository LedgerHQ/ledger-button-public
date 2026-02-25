import "../../atom/crypto-icon/ledger-crypto-icon";

import { cva } from "class-variance-authority";
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

const chainItemVariants = cva([
  "flex min-w-full items-center justify-between p-8",
  "bg-base-transparent transition duration-150 ease-in-out",
]);

const clickableVariants = cva([], {
  variants: {
    clickable: {
      true: [
        "cursor-pointer transition duration-150 ease-in-out hover:bg-base-transparent-hover",
      ],
      false: ["cursor-default"],
    },
  },
});

export type ChainItemType = "token" | "network";
export type IconVariant = "rounded" | "square";

export interface LedgerChainItemAttributes {
  ledgerId: string;
  title: string;
  subtitle: string;
  ticker: string;
  value: string;
  fiatValue?: string;
  isClickable: boolean;
  type: ChainItemType;
  iconVariant?: IconVariant;
}

@customElement("ledger-chain-item")
@tailwindElement()
export class LedgerChainItem extends LitElement {
  @property({ type: String, attribute: "ledger-id" })
  ledgerId = "";

  @property({ type: String })
  override title = "";

  @property({ type: String })
  subtitle = "";

  @property({ type: String })
  ticker = "";

  @property({ type: String })
  value = "";

  @property({ type: String })
  fiatValue?: string;

  @property({ type: Boolean, attribute: "isClickable" })
  isClickable = false;

  @property({ type: String })
  type: ChainItemType = "token";

  @property({ type: String })
  iconVariant?: IconVariant;

  private get containerClasses() {
    return {
      [chainItemVariants()]: true,
      [clickableVariants({ clickable: this.isClickable })]: true,
    };
  }

  private handleItemClick() {
    if (!this.isClickable) return;

    this.dispatchEvent(
      new CustomEvent("chain-item-click", {
        bubbles: true,
        composed: true,
        detail: {
          ledgerId: this.ledgerId,
          title: this.title,
          subtitle: this.subtitle,
          ticker: this.ticker,
          value: this.value,
          type: this.type,
          timestamp: Date.now(),
        },
      }),
    );
  }

  private handleItemKeyDown(event: KeyboardEvent) {
    if (!this.isClickable) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleItemClick();
    }
  }

  private renderLeftSection() {
    const iconVariant =
      this.iconVariant ?? (this.type === "token" ? "rounded" : "square");

    return html`
      <div class="flex items-center gap-12">
        <ledger-crypto-icon
          ledger-id=${this.ledgerId}
          variant=${iconVariant}
          size="large"
          ticker=${this.ticker}
          alt=${this.title.substring(0, 1)}
        ></ledger-crypto-icon>
        <div class="flex flex-col gap-4 text-left">
          ${this.title
            ? html`<span class="text-base body-2-semi-bold"
                >${this.title}</span
              >`
            : nothing}
          ${this.subtitle
            ? html`<span class="text-muted body-3"
                >${this.subtitle}</span
              >`
            : nothing}
        </div>
      </div>
    `;
  }

  private renderRightSection() {
    return html`
      <div
        class="flex flex-col items-end justify-center text-right"
      >
        ${this.fiatValue
          ? html`<span class="text-base body-2-semi-bold"
              >${this.fiatValue}</span
            >`
          : nothing}
        <span class="text-muted body-3"
          >${this.value} ${this.ticker}</span
        >
      </div>
    `;
  }

  override render() {
    return html`
      <div
        class="flex min-w-full flex-col overflow-hidden rounded-md"
      >
        ${this.isClickable
          ? html`
              <button
                class=${classMap(this.containerClasses)}
                @click=${this.handleItemClick}
                @keydown=${this.handleItemKeyDown}
                role="button"
                tabindex="0"
                aria-label=${this.title || this.ticker || ""}
              >
                ${this.renderLeftSection()} ${this.renderRightSection()}
              </button>
            `
          : html`
              <div
                class=${classMap(this.containerClasses)}
                aria-label=${this.title || this.ticker || ""}
              >
                ${this.renderLeftSection()} ${this.renderRightSection()}
              </div>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-chain-item": LedgerChainItem;
  }
}

export default LedgerChainItem;
