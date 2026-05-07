import "../../atom/crypto-icon/ledger-crypto-icon";
import "../../atom/icon/ledger-icon";
import "../../atom/skeleton/ledger-skeleton";

import type { FiatBalance } from "@ledgerhq/ledger-wallet-provider-core";
import { cva } from "class-variance-authority";
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";
import { formatAddress } from "../../../utils/format-address.js";
import { formatFiatBalance } from "../../../utils/format-fiat.js";

const accountItemVariants = cva([
  "flex min-w-full cursor-pointer justify-between p-12",
  "bg-muted hover:bg-muted-hover transition duration-150 ease-in-out",
]);

export type AccountItemClickEventDetail = {
  title: string;
  address: string;
  ticker: string;
  ledgerId: string;
  balance: string;
  linkLabel: string;
  timestamp: number;
  currencyId: string;
};

export interface LedgerAccountItemMoleculeAttributes {
  title: string;
  address: string;
  ticker: string;
  ledgerId: string;
  balance: string;
  linkLabel: string;
  isBalanceLoading?: boolean;
  isBalanceError?: boolean;
}

@customElement("ledger-account-item")
@tailwindElement()
export class LedgerAccountItemMolecule extends LitElement {
  @property({ type: String })
  override title = "";

  @property({ type: String })
  address = "";

  @property({ type: String })
  ticker = "";

  @property({ type: String, attribute: "ledger-id" })
  ledgerId = "";

  @property({ type: String })
  balance = "0.00";

  @property({ type: String, attribute: "link-label" })
  linkLabel = "";

  @property({ type: Number })
  tokens = 0;

  @property({ type: String })
  currencyId = "";

  @property({ type: Boolean, attribute: "is-balance-loading" })
  isBalanceLoading = false;

  @property({ type: Boolean, attribute: "is-balance-error" })
  isBalanceError = false;

  @property({ type: Object, attribute: false })
  fiatBalance?: FiatBalance;

  @property({ type: Boolean, attribute: "is-fiat-loading" })
  isFiatLoading = false;

  @property({ type: Boolean, attribute: "is-fiat-error" })
  isFiatError = false;

  @property({ type: String })
  locale!: string;

  private get containerClasses() {
    return {
      [accountItemVariants()]: true,
    };
  }

  private handleAccountClick() {
    this.dispatchEvent(
      new CustomEvent<AccountItemClickEventDetail>("account-item-click", {
        bubbles: true,
        composed: true,
        detail: {
          title: this.title,
          address: this.address,
          ticker: this.ticker,
          ledgerId: this.ledgerId,
          balance: this.balance,
          linkLabel: this.linkLabel,
          currencyId: this.currencyId,
          timestamp: Date.now(),
        },
      }),
    );
  }

  private handleAccountKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleAccountClick();
    }
  }

  private handleShowTokens() {
    this.dispatchEvent(
      new CustomEvent("account-item-show-tokens-click", {
        bubbles: true,
        composed: true,
        detail: {
          title: this.title,
          address: this.address,
          ticker: this.ticker,
          ledgerId: this.ledgerId,
          balance: this.balance,
          linkLabel: this.linkLabel,
          currencyId: this.currencyId,
          timestamp: Date.now(),
        },
      }),
    );
  }

  private renderAccountInfo() {
    return html`
      <div class="flex flex-col gap-4 text-left">
        <span class="body-2-semi-bold text-base">${this.title}</span>
        <div class="flex items-center gap-4">
          <span class="text-muted body-3 whitespace-nowrap">
            ${formatAddress(this.address)}
          </span>
          <ledger-crypto-icon
            ledger-id=${this.currencyId}
            variant="square"
            size="small"
          ></ledger-crypto-icon>
        </div>
      </div>
    `;
  }

  private renderValueInfo() {
    if (this.isBalanceLoading) {
      return html`
        <div class="flex flex-col items-end gap-4">
          <ledger-skeleton class="h-16 w-80 rounded-full"></ledger-skeleton>
        </div>
      `;
    }

    if (this.isBalanceError) {
      return html`
        <div class="flex flex-col items-end gap-4">
          <span class="body-2-semi-bold text-base">--</span>
        </div>
      `;
    }

    const fiatValue = formatFiatBalance(this.fiatBalance, this.locale);

    return html`
      <div class="flex flex-col items-end gap-4">
        ${this.renderFiatValue(fiatValue)}
        <span class="text-muted body-3">${this.balance} ${this.ticker}</span>
      </div>
    `;
  }

  private renderFiatValue(fiatValue: string) {
    if (this.isFiatLoading) {
      return html`<ledger-skeleton
        class="h-14 w-60 rounded-full"
      ></ledger-skeleton>`;
    }

    if (this.isFiatError || !fiatValue) {
      return nothing;
    }

    return html` <span class="body-2-semi-bold text-base">${fiatValue}</span> `;
  }

  private renderTokenRow() {
    if (this.isBalanceError) {
      return "";
    }

    if (this.isBalanceLoading) {
      return html`
        <div
          class="border-muted-subtle bg-muted flex items-center justify-between border border-r-0 border-b-0 border-l-0 p-12"
        >
          <ledger-skeleton class="h-16 w-112 rounded-full"></ledger-skeleton>
        </div>
      `;
    }

    if (!this.linkLabel || this.tokens <= 0) {
      return "";
    }

    return html`
      <button
        class="group border-muted-subtle bg-muted hover:bg-muted-hover flex items-center justify-between border border-r-0 border-b-0 border-l-0 p-12 transition duration-300 ease-in-out"
        @click=${this.handleShowTokens}
      >
        <div class="body-3-semi-bold flex h-20 items-center text-base">
          ${this.linkLabel} (${this.tokens})
        </div>
        <div
          class="pr-2 transition-transform duration-150 ease-in-out group-hover:translate-x-1"
        >
          <ledger-icon type="chevronRight" .size=${16}></ledger-icon>
        </div>
      </button>
    `;
  }

  override render() {
    return html`
      <div class="flex min-w-full flex-col overflow-hidden rounded-md">
        <button
          class=${classMap(this.containerClasses)}
          @click=${this.handleAccountClick}
          @keydown=${this.handleAccountKeyDown}
          role="button"
          tabindex="0"
          aria-label=${this.title || ""}
        >
          ${this.renderAccountInfo()} ${this.renderValueInfo()}
        </button>
        ${this.renderTokenRow()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-account-item": LedgerAccountItemMolecule;
  }

  interface WindowEventMap {
    "account-item-click": CustomEvent<AccountItemClickEventDetail>;
    "account-item-show-tokens-click": CustomEvent<AccountItemClickEventDetail>;
  }
}

export default LedgerAccountItemMolecule;
