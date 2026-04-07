import "../../atom/crypto-icon/ledger-crypto-icon.js";
import "../../atom/icon/ledger-icon.js";

import { cva } from "class-variance-authority";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";
import { formatAddress } from "../../../utils/format-address.js";

const styles = css`
  :host {
    display: flex;
  }
`;

@customElement("ledger-account-switch")
@tailwindElement(styles)
export class LedgerAccountSwitch extends LitElement {
  @property({ type: Object })
  account?: {
    id: string;
    currencyId: string;
    freshAddress: string;
    seedIdentifier: string;
    derivationMode: string;
    index: number;
    name: string;
  };

  private handleClick = () => {
    this.dispatchEvent(
      new CustomEvent("account-switch", {
        bubbles: true,
        composed: true,
        detail: {
          account: this.account,
        },
      }),
    );
  };

  override render() {
    if (!this.account) {
      return;
    }
    const buttonClass = cva([
      "flex max-w-full cursor-pointer flex-col rounded-sm p-4 text-left",
      "hover:bg-muted-hover active:bg-muted-pressed",
    ]);

    return html`
      <button class=${buttonClass()} @click=${this.handleClick}>
        <div class="flex items-center gap-4">
          <div class="body-2-semi-bold flex min-w-0 flex-1 truncate text-base">
            <span class="body-2-semi-bold text-base">${this.account.name}</span>
          </div>
          <ledger-icon
            class="shrink-0"
            type="chevronDown"
            size="medium"
          ></ledger-icon>
        </div>
        <div class="flex items-center gap-4">
          <span
            class="text-muted body-3 overflow-hidden text-nowrap text-ellipsis"
          >
            ${formatAddress(this.account.freshAddress)}
          </span>
          <ledger-crypto-icon
            .ledgerId=${this.account.currencyId}
            size="small"
            variant="square"
          ></ledger-crypto-icon>
        </div>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-account-switch": LedgerAccountSwitch;
  }

  interface WindowEventMap {
    "account-switch": CustomEvent<{
      account: LedgerAccountSwitch["account"];
    }>;
  }
}
