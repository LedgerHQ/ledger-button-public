import "../../atom/button/ledger-button";
import "../../atom/icon/ledger-icon";
import "../../atom/chip/ledger-chip";

import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";
import { type DeviceModelId } from "../../atom/icon/device-icon/device-icon";

export interface LedgerToolbarAttributes {
  title?: string;
  deviceModelId?: DeviceModelId;
  canGoBack: boolean;
  canClose: boolean;
  showSettings: boolean;
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

  @property({ type: Boolean, reflect: true })
  showSettings = false;

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

  private handleSettingsClick = () => {
    this.dispatchEvent(
      new CustomEvent("ledger-toolbar-settings-click", {
        bubbles: true,
        composed: true,
      }),
    );
  };

  override render() {
    return html`
      <div
        class="relative flex w-full min-w-full items-center justify-between px-24 py-16"
      >
        <div class="flex w-72 items-center justify-start">
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
        </div>
        <div
          class="pointer-events-none absolute left-0 right-0 flex items-center justify-center"
        >
          <div class="pointer-events-auto">
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
          </div>
        </div>

        <div class="flex w-72 items-center justify-end gap-8">
          ${this.showSettings
            ? html`
                <div
                  class="flex h-32 w-32 items-center justify-center"
                >
                  <ledger-button
                    data-testid="settings-button"
                    .icon=${true}
                    variant="noBackground"
                    iconType="settings"
                    size="xs"
                    @click=${this.handleSettingsClick}
                  >
                  </ledger-button>
                </div>
              `
            : nothing}
          <div
            class="flex h-32 w-32 items-center justify-center"
          >
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

    "ledger-toolbar-settings-click": CustomEvent<void>;
  }
}

export default LedgerToolbar;
