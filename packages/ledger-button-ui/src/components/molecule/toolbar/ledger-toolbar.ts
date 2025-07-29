import "../../atom/button/ledger-button";
import "../../atom/icon/ledger-icon";

import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element";

export interface LedgerToolbarAttributes {
  title?: string;
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
      new CustomEvent("ledger-toolbar-close", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  override render() {
    return html`
      <div
        class="flex w-full min-w-full items-center justify-between px-24 py-16"
      >
        <div class="flex h-32 w-32 items-center justify-center">
          <slot name="left-icon">
            <ledger-icon type="ledger" size="medium"></ledger-icon>
          </slot>
        </div>
        ${this.title
          ? html`<h2 class="text-base body-2">${this.title}</h2>`
          : ""}
        <div class="flex h-32 w-32 cursor-pointer items-center justify-center">
          <ledger-button
            .icon=${true}
            variant="noBackground"
            iconType="close"
            size="xs"
            @click=${this.handleClose}
          >
          </ledger-button>
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
