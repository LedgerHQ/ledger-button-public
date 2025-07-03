import "./context/core-context.js";

import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("ledger-button")
export class LedgerButton extends LitElement {
  override render() {
    return html`<core-provider></core-provider>`;
  }
}
