import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../..";

@customElement("ledger-balance")
@tailwindElement()
export class LedgerBalance extends LitElement {
  @property({ type: String })
  label = "Balance";

  @property({ type: Number })
  balance = 0;

  @property({ type: String })
  ticker = "";

  override render() {
    return html`
      <div class="flex flex-col">
        <span class="self-stretch text-muted body-3">${this.label}</span>
        <span class="self-stretch text-base body-2-semi-bold">
          ${this.balance} ${this.ticker}
        </span>
      </div>
    `;
  }
}
