import "./components/atom/button/ledger-button";

import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { tailwindElement } from "./tailwind-element.js";

const styles = css`
  :host {
    display: inline-block;
  }
`;
@customElement("ledger-button-ui")
@tailwindElement(styles)
export class LedgerButtonUI extends LitElement {
  override render() {
    return html`
      <ledger-button
        label="Connect Ledger"
        variant="primary"
        size="large"
        icon
      ></ledger-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-button-ui": LedgerButtonUI;
  }
}

export default LedgerButtonUI;
