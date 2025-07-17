import "./components/atom/button/ledger-button";

import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";

import tailwindStyles from "./styles.css?inline";

@customElement("ledger-button-ui")
export class LedgerButtonUI extends LitElement {
  static override styles = [
    unsafeCSS(tailwindStyles),
    css`
      :host {
        display: inline-block;
      }
    `,
  ];

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
