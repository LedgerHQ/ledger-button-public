import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";

@customElement("ledger-transaction-list")
@tailwindElement()
export class LedgerTransactionList extends LitElement {
  override render() {
    return html`
      <div
        class="lb-flex lb-flex-col lb-items-center lb-justify-center lb-py-32"
      >
        <span class="lb-text-muted lb-body-2">Transaction List</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-transaction-list": LedgerTransactionList;
  }
}

export default LedgerTransactionList;
