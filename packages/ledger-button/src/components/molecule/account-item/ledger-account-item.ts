import "../../atom/crypto-icon/ledger-crypto-icon";
import "../../atom/icon/ledger-icon";

import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

const accountItemVariants = cva([
  "flex min-w-full cursor-pointer justify-between p-12",
  "bg-muted transition duration-150 ease-in-out hover:bg-muted-hover",
]);

export type AccountItemClickEventDetail = {
  title: string;
  address: string;
  ticker: string;
  ledgerId: string;
  balance: string;
  linkLabel: string;
  timestamp: number;
};

export interface LedgerAccountItemMoleculeAttributes {
  title: string;
  address: string;
  ticker: string;
  ledgerId: string;
  balance: string;
  linkLabel: string;
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
          timestamp: Date.now(),
        },
      }),
    );
  }

  private formatAddress(address: string): string {
    if (!address || address.length <= 8) {
      return address;
    }
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  private renderAccountInfo() {
    return html`
      <div class="flex flex-col gap-4 text-left">
        <span class="text-base body-2-semi-bold">${this.title}</span>
        <div class="flex items-center gap-4">
          <span class="whitespace-nowrap text-muted body-3">
            ${this.formatAddress(this.address)}
          </span>
          <ledger-crypto-icon
            ledger-id=${this.ledgerId}
            variant="square"
            size="small"
          ></ledger-crypto-icon>
        </div>
      </div>
    `;
  }

  private renderValueInfo() {
    return html`
      <div class="flex items-center justify-center">
        <span class="text-base body-2-semi-bold"
          >${this.balance} ${this.ticker}</span
        >
      </div>
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
        ${this.linkLabel
          ? html`
              <button
                class="group flex items-center justify-between border-t-1 border-muted-subtle bg-muted p-12 transition duration-300 ease-in-out hover:bg-muted-hover"
                @click=${this.handleShowTokens}
              >
                <div class="flex h-20 items-center text-base body-3-semi-bold">
                  ${this.linkLabel}
                </div>
                <div
                  class="group-hover:translate-x-1 pr-2 transition-transform duration-150 ease-in-out"
                >
                  <ledger-icon type="chevronRight" size="small"></ledger-icon>
                </div>
              </button>
            `
          : ""}
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
