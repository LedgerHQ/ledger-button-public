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
  "lb-flex lb-min-w-full lb-cursor-pointer lb-justify-between lb-p-12",
  "lb-bg-muted lb-transition lb-duration-150 lb-ease-in-out hover:lb-bg-muted-hover",
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
      <div class="lb-flex lb-flex-col lb-gap-4 lb-text-left">
        <span class="lb-text-base lb-body-2-semi-bold">${this.title}</span>
        <div class="lb-flex lb-items-center lb-gap-4">
          <span class="lb-whitespace-nowrap lb-text-muted lb-body-3">
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
        <div class="lb-flex lb-flex-col lb-items-end lb-gap-4">
          <ledger-skeleton
            class="lb-h-16 lb-w-80 lb-rounded-full"
          ></ledger-skeleton>
        </div>
      `;
    }

    if (this.isBalanceError) {
      return html`
        <div class="lb-flex lb-flex-col lb-items-end lb-gap-4">
          <span class="lb-text-base lb-body-2-semi-bold">--</span>
        </div>
      `;
    }

    const fiatValue = formatFiatBalance(this.fiatBalance);

    return html`
      <div class="lb-flex lb-flex-col lb-items-end lb-gap-4">
        ${this.renderFiatValue(fiatValue)}
        <span class="lb-text-muted lb-body-3"
          >${this.balance} ${this.ticker}</span
        >
      </div>
    `;
  }

  private renderFiatValue(fiatValue: string) {
    if (this.isFiatLoading) {
      return html`<ledger-skeleton
        class="lb-w-60 lb-h-14 lb-rounded-full"
      ></ledger-skeleton>`;
    }

    if (this.isFiatError || !fiatValue) {
      return nothing;
    }

    return html`
      <span class="lb-text-base lb-body-2-semi-bold">${fiatValue}</span>
    `;
  }

  private renderTokenRow() {
    if (this.isBalanceError) {
      return "";
    }

    if (this.isBalanceLoading) {
      return html`
        <div
          class="lb-flex lb-items-center lb-justify-between lb-border lb-border-b-0 lb-border-l-0 lb-border-r-0 lb-border-muted-subtle lb-bg-muted lb-p-12"
        >
          <ledger-skeleton
            class="lb-h-16 lb-w-112 lb-rounded-full"
          ></ledger-skeleton>
        </div>
      `;
    }

    if (!this.linkLabel || this.tokens <= 0) {
      return "";
    }

    return html`
      <button
        class="group lb-flex lb-items-center lb-justify-between lb-border lb-border-b-0 lb-border-l-0 lb-border-r-0 lb-border-muted-subtle lb-bg-muted lb-p-12 lb-transition lb-duration-300 lb-ease-in-out hover:lb-bg-muted-hover"
        @click=${this.handleShowTokens}
      >
        <div
          class="lb-flex lb-h-20 lb-items-center lb-text-base lb-body-3-semi-bold"
        >
          ${this.linkLabel} (${this.tokens})
        </div>
        <div
          class="lb-pr-2 lb-transition-transform lb-duration-150 lb-ease-in-out group-hover:lb-translate-x-1"
        >
          <ledger-icon type="chevronRight" size="small"></ledger-icon>
        </div>
      </button>
    `;
  }

  override render() {
    return html`
      <div
        class="lb-flex lb-min-w-full lb-flex-col lb-overflow-hidden lb-rounded-md"
      >
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
