import "../../atom/icon/ledger-icon.js";

import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element";

@customElement("ledger-account-switch")
@tailwindElement()
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

    return html`
      <button
        class="inline-flex h-48 max-w-96 cursor-pointer flex-col rounded-sm p-4 hover:bg-muted-hover active:bg-muted-pressed"
        @click=${this.handleClick}
      >
        <div class="flex flex-1 basis-80 items-center justify-between gap-4">
          <span
            class="basis-56 overflow-hidden text-ellipsis text-nowrap text-base body-2-semi-bold"
            >${this.account.name}</span
          >
          <ledger-icon
            class="shrink-0"
            type="chevronDown"
            size="medium"
          ></ledger-icon>
        </div>
        <span
          class="basis-80 overflow-hidden text-ellipsis text-nowrap text-muted body-3"
        >
          ${this.account.freshAddress}
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
