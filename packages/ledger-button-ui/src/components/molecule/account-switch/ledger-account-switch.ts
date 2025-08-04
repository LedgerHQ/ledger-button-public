import "../../atom/icon/ledger-icon.js";

import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element";

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

  private formatAddress(address: string) {
    return address.slice(0, 4) + "..." + address.slice(-4);
  }

  override render() {
    if (!this.account) {
      return;
    }

    return html`
      <button
        class="flex h-48 max-w-full cursor-pointer flex-col rounded-sm p-4 text-left hover:bg-muted-hover active:bg-muted-pressed"
        @click=${this.handleClick}
      >
        <div class="flex items-center gap-4">
          <div class="flex min-w-0 flex-1 truncate text-base body-2-semi-bold">
            <span class="truncate">${this.account.name}</span>
          </div>
          <ledger-icon
            class="shrink-0"
            type="chevronDown"
            size="medium"
          ></ledger-icon>
        </div>
        <span
          class="grow basis-80 overflow-hidden text-ellipsis text-nowrap text-muted body-3"
        >
          ${this.formatAddress(this.account.freshAddress)}
        </span>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-account-switch": LedgerAccountSwitch;
  }

  interface CustomEventMap {
    "account-switch": CustomEvent<{
      account: LedgerAccountSwitch["account"];
    }>;
  }
}
