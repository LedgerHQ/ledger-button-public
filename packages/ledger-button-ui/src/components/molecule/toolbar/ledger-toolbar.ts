import "../../atom/button/ledger-button";
import "../../atom/icon/ledger-icon";

import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import tailwindStyles from "../../../styles.css?inline";

export interface LedgerToolbarAttributes {
  title?: string;
  showClose?: boolean;
  showLogo?: boolean;
}

@customElement("ledger-toolbar")
export class LedgerToolbar extends LitElement {
  @property({ type: String })
  override title = "";

  static override styles = [
    unsafeCSS(tailwindStyles),
    css`
      :host {
        display: block;
      }
    `,
  ];

  private handleClose = () => {
    this.dispatchEvent(
      new CustomEvent("toolbar-close", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
        },
      }),
    );
  };

  override render() {
    return html`
      <div class="w-full flex items-center justify-between p-16">
        <div class="h-20 w-20">
          <ledger-icon type="ledger" size="medium"></ledger-icon>
        </div>
        ${this.title
          ? html`<h2 class="text-14 font-semibold font-inter text-white">
              ${this.title}
            </h2>`
          : ""}
        <div class="h-20 w-20 cursor-pointer">
          <ledger-icon
            type="close"
            size="large"
            @click=${this.handleClose}
          ></ledger-icon>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-toolbar": LedgerToolbar;
  }
}

export default LedgerToolbar;
