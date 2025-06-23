import "../../atom/button/ledger-button-atom";
import "../../atom/icon/ledger-icon-atom";

import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import tailwindStyles from "../../../../styles.css?inline";

export interface LedgerToolbarMoleculeAttributes {
  title?: string;
  showClose?: boolean;
  showLogo?: boolean;
}

@customElement("ledger-toolbar-molecule")
export class LedgerToolbarMolecule extends LitElement {
  @property({ type: String })
  override title = "";

  @property({ type: Boolean, attribute: "show-close" })
  showClose = true;

  @property({ type: Boolean, attribute: "show-logo" })
  showLogo = true;

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
      <div class="flex items-center justify-between p-16 w-full">
        <div class="flex items-center gap-12">
          ${this.showLogo
            ? html`<div class="w-20 h-20">
                <ledger-icon-atom
                  type="ledger"
                  size="medium"
                ></ledger-icon-atom>
              </div>`
            : ""}
          ${this.title
            ? html`<h2 class="text-20 font-inter font-semibold text-white">
                ${this.title}
              </h2>`
            : ""}
        </div>
        ${this.showClose
          ? html`<div class="w-20 h-20">
              <ledger-icon-atom
                type="close"
                size="medium"
                @click=${this.handleClose}
                style="cursor: pointer;"
              ></ledger-icon-atom>
            </div>`
          : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-toolbar-molecule": LedgerToolbarMolecule;
  }
}

export default LedgerToolbarMolecule;
