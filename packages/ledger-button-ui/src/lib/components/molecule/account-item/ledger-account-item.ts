import "../../atom/icon/ledger-icon";

import { cva } from "class-variance-authority";
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import tailwindStyles from "../../../../styles.css?inline";

const accountItemVariants = cva([
  "flex min-w-full cursor-pointer justify-between p-12",
  "bg-muted hover:bg-muted-hover",
]);

export interface LedgerAccountItemMoleculeAttributes {
  title: string;
  address: string;
  token: string;
  value: number;
  linkLabel: string;
}

@customElement("ledger-account-item")
export class LedgerAccountItemMolecule extends LitElement {
  @property({ type: String })
  override title = "";

  @property({ type: String })
  address = "";

  @property({ type: String })
  token = "";

  @property({ type: Number })
  value = 0;

  @property({ type: String, attribute: "link-label" })
  linkLabel = "";

  static override styles = [unsafeCSS(tailwindStyles)];

  private get containerClasses() {
    return {
      [accountItemVariants()]: true,
    };
  }

  private handleAccountClick() {
    this.dispatchEvent(
      new CustomEvent("account-item-click", {
        bubbles: true,
        composed: true,
        detail: {
          title: this.title,
          address: this.address,
          token: this.token,
          value: this.value,
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
        <div class="flex items-center gap-8">
          <span class="whitespace-nowrap text-muted body-3">
            ${this.formatAddress(this.address)}
          </span>
          <ledger-icon
            type=${this.token || "ethereum"}
            size="medium"
          ></ledger-icon>
        </div>
      </div>
    `;
  }

  private renderValueInfo() {
    return html`
      <div class="flex items-center justify-center">
        <span class="text-base body-2-semi-bold"
          >${this.value} ${this.token}</span
        >
      </div>
    `;
  }

  override render() {
    return html`
      <div class="dark flex min-w-full flex-col overflow-hidden rounded-md">
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
                class="flex items-center justify-between border-t-1 border-muted-subtle bg-muted px-12 py-8 hover:bg-muted-hover"
              >
                <span class="text-base body-3-semi-bold"
                  >${this.linkLabel}</span
                >
                <ledger-icon type="chevron" size="small"></ledger-icon>
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
}

export default LedgerAccountItemMolecule;
