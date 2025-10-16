import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";

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
      <div class="lb-flex lb-flex-col">
        <span class="lb-self-stretch lb-text-muted lb-body-3"
          >${this.label}</span
        >
        <span class="lb-self-stretch lb-text-base lb-body-2-semi-bold">
          ${this.balance} ${this.ticker}
        </span>
      </div>
    `;
  }
}
