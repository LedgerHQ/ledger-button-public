import "../../atom/button/ledger-button";
import "../../atom/icon/ledger-icon";

import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element";

export interface LedgerToolbarAttributes {
  title?: string;
  showClose?: boolean;
  showLogo?: boolean;
}

const styles = css`
  :host {
    display: block;
  }
`;

@customElement("ledger-toolbar")
@tailwindElement(styles)
export class LedgerToolbar extends LitElement {
  @property({ type: String })
  override title = "";

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
      <div
        class="w-full flex min-w-full items-center justify-between px-24 py-16"
      >
        <div class="flex h-20 w-20 items-center justify-center">
          <ledger-icon type="ledger" size="small"></ledger-icon>
        </div>
        ${this.title
          ? html`<h2 class="text-base body-2">${this.title}</h2>`
          : ""}
        <div class="flex h-20 w-20 cursor-pointer items-center justify-center">
          <ledger-icon
            type="close"
            size="small"
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
