import "../../atom/button/ledger-button";
import "../../atom/icon/ledger-icon";
import "../../atom/chip/ledger-chip";

import { DeviceModelId } from "@ledgerhq/ledger-button-core";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";

export interface LedgerToolbarAttributes {
  title?: string;
  deviceModelId?: DeviceModelId;
  canGoBack: boolean;
  canClose: boolean;
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

  @property({ type: Boolean, reflect: true })
  canClose = false;

  @property({ type: Boolean, reflect: true })
  canGoBack = false;

  @property({ type: String })
  deviceModelId?: DeviceModelId;

  private handleClose = () => {
    this.dispatchEvent(
      new CustomEvent("ledger-toolbar-close", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  private handleChipClick = (e: CustomEvent) => {
    this.dispatchEvent(
      new CustomEvent("ledger-toolbar-chip-click", {
        bubbles: true,
        composed: true,
        detail: e.detail,
      }),
    );
  };

  private handleGoBackClick = (e: CustomEvent) => {
    this.dispatchEvent(
      new CustomEvent("ledger-toolbar-go-back-click", {
        bubbles: true,
        composed: true,
        detail: e.detail,
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
            ${this.canGoBack
              ? html`
                  <ledger-button
                    data-testid="close-button"
                    .icon=${true}
                    variant="noBackground"
                    iconType="back"
                    size="xs"
                    @click=${this.handleGoBackClick}
                  >
                  </ledger-button>
                `
              : html` <ledger-icon type="ledger" size="medium"></ledger-icon> `}
          </slot>
        </div>
        ${this.deviceModelId
          ? html`
              <slot name="chip">
                <ledger-chip
                  label=${this.title}
                  deviceModelId=${this.deviceModelId}
                  @ledger-chip-click=${this.handleChipClick}
                ></ledger-chip>
              </slot>
            `
          : this.title
            ? html`<h2 class="text-base body-2">${this.title}</h2>`
            : nothing}

        <div class="flex h-32 w-32 items-center justify-center">
          ${this.canClose
            ? html`
                <ledger-button
                  data-testid="close-button"
                  .icon=${true}
                  variant="noBackground"
                  iconType="close"
                  size="xs"
                  @click=${this.handleClose}
                >
                </ledger-button>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-toolbar": LedgerToolbar;
  }

  interface WindowEventMap {
    "ledger-toolbar-close": CustomEvent<void>;

    "ledger-toolbar-chip-click": CustomEvent<{
      timestamp: number;
      label: string;
      deviceModelId: DeviceModelId;
    }>;

    "ledger-toolbar-go-back-click": CustomEvent<void>;
  }
}

export default LedgerToolbar;
