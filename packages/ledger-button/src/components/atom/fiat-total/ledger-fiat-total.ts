import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";

/**
 * Formats a numeric value as a fiat currency string using the user's browser locale.
 *
 * @param value - The fiat amount (e.g., 1234.56)
 * @param currencyCode - ISO 4217 currency code (e.g., "USD", "EUR", "GBP")
 * @returns The formatted fiat string (e.g., "$1,234.56" for en-US, "1 234,56 $US" for fr-FR)
 *
 * @example
 * formatFiatValue(1234.56, "USD") // "$1,234.56" (en-US) or "1 234,56 $US" (fr-FR)
 *
 * @example
 * formatFiatValue(42.1, "EUR") // "€42.10" (en-US) or "42,10 €" (fr-FR)
 */
export function formatFiatValue(
  value: number | string,
  currencyCode = "USD",
): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(value));
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
