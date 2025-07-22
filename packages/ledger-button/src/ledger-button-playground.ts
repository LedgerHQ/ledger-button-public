import "@ledgerhq/ledger-button-ui";
import "./context/core-context.js";
import "./context/language-context.js";
import "./ledger-button-app.js";

import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("ledger-button-playground")
export class LedgerButtonPlayground extends LitElement {
  override render() {
    return html`
      <core-provider>
        <language-provider>
          <ledger-button-app></ledger-button-app>
        </language-provider>
      </core-provider>
    `;
  }
}
