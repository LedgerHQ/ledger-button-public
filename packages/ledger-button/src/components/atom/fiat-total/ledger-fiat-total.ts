import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";
import { formatFiatValue } from "../../../utils/format-fiat.js";

@customElement("ledger-fiat-total")
@tailwindElement()
export class LedgerFiatTotal extends LitElement {
  @property({ type: String })
  value = "0";

  @property({ type: String })
  currency!: string;

  @property({ type: String })
  locale!: string;

  override render() {
    return html`
      <span class="heading-2 text-base">
        ${formatFiatValue(this.value, this.currency, this.locale)}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-fiat-total": LedgerFiatTotal;
  }
}
