import "../../components/index.js";

import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { tailwindElement } from "../../tailwind-element.js";

@customElement("token-list-screen")
@tailwindElement()
export class TokenListScreen extends LitElement {
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
    "token-list-screen": TokenListScreen;
  }
}
