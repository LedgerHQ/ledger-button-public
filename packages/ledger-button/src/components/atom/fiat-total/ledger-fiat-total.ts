import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";

function formatFiatValue(value: string): string {
  const numericValue = parseFloat(value);

  const formattedNumber = numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `$${formattedNumber}`;
}

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
