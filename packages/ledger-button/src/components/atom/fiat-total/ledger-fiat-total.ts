import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";
import { formatFiatValue } from "../../../utils/format-fiat.js";

@customElement("ledger-fiat-total")
@tailwindElement()
export class LedgerFiatTotal extends LitElement {
  @property({ type: String })
  value = "0";

  override render() {
    return html`
      <span class="lb-text-base lb-heading-1" style="font-size: 40px;">
        ${formatFiatValue(this.value)}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-fiat-total": LedgerFiatTotal;
  }
}
