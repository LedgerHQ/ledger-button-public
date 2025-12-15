import "../icon/ledger-icon";

import { consume } from "@lit/context";
import { css, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

import { CoreContext, coreContext } from "../../../context/core-context.js";
import { tailwindElement } from "../../../tailwind-element.js";
import { FloatingButtonController } from "./ledger-floating-button-controller.js";

const styles = css`
  :host {
    display: block;
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
  }

  :host([hidden]) {
    display: none;
  }

  .floating-button {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .floating-button:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }

  .floating-button:active {
    transform: scale(0.95);
  }
`;

@customElement("ledger-floating-button")
@tailwindElement(styles)
export class LedgerFloatingButton extends LitElement {
  @consume({ context: coreContext })
  @state()
  private coreContext!: CoreContext;

  private controller!: FloatingButtonController;

  override connectedCallback() {
    super.connectedCallback();
    if (this.coreContext) {
      this.controller = new FloatingButtonController(this, this.coreContext);
    }
  }

  override updated() {
    if (!this.controller && this.coreContext) {
      this.controller = new FloatingButtonController(this, this.coreContext);
      this.requestUpdate();
    }
  }

  private handleClick = () => {
    this.dispatchEvent(
      new CustomEvent("ledger-internal-floating-button-click", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  override render() {
    if (!this.controller?.shouldShow) {
      return nothing;
    }

    return html`
      <button
        class="floating-button lb-flex lb-h-64 lb-w-64 lb-cursor-pointer lb-items-center lb-justify-center lb-rounded-full lb-bg-black lb-text-on-interactive"
        @click=${this.handleClick}
        aria-label="Open Ledger account menu"
      >
        <ledger-icon type="ledger" size="large" fillColor="white"></ledger-icon>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-floating-button": LedgerFloatingButton;
  }
}
