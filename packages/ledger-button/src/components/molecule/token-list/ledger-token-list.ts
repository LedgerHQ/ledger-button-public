import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";

@customElement("ledger-token-list")
@tailwindElement()
export class LedgerTokenList extends LitElement {
  override render() {
    return html`
      <div
        class="lb-flex lb-flex-col lb-items-center lb-justify-center lb-py-32"
      >
        <span class="lb-text-muted lb-body-2">Token List</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-token-list": LedgerTokenList;
  }
}

export default LedgerTokenList;
