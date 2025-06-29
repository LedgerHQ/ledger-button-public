import "../../atom/button/ledger-button-atom";
import "../../atom/icon/ledger-icon-atom";
import "../../molecule/toolbar/ledger-toolbar-molecule";

import { cva } from "class-variance-authority";
import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import tailwindStyles from "../../../../styles.css?inline";

export type StatusType = "success" | "error";

export interface LedgerStatusModalOrganismAttributes {
  type?: StatusType;
  title?: string;
  description?: string;
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  showSecondaryButton?: boolean;
}

const statusIconVariants = cva(
  ["mb-24 flex h-64 w-64 items-center justify-center rounded-full"],
  {
    variants: {
      type: {
        success: "bg-green-500/20",
        error: "bg-red-500/20",
      },
    },
    defaultVariants: {
      type: "success",
    },
  },
);

const iconColorVariants = cva("", {
  variants: {
    type: {
      success: "text-green-500",
      error: "text-red-500",
    },
  },
  defaultVariants: {
    type: "success",
  },
});

@customElement("ledger-status-modal-organism")
export class LedgerStatusModalOrganism extends LitElement {
  @property({ type: String })
  type: StatusType = "success";

  @property({ type: String })
  override title = "";

  @property({ type: String })
  description = "";

  @property({ type: String, attribute: "primary-button-label" })
  primaryButtonLabel = "Close";

  @property({ type: String, attribute: "secondary-button-label" })
  secondaryButtonLabel = "Secondary action";

  @property({ type: Boolean, attribute: "show-secondary-button" })
  showSecondaryButton = false;

  static override styles = [
    unsafeCSS(tailwindStyles),
    css`
      :host {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        z-index: 1000;
      }

      .modal-content {
        background: #1a1a1a;
        border-radius: 24px;
        max-width: 400px;
        width: 90%;
        max-height: 90vh;
        overflow: auto;
      }

      .status-icon {
        color: inherit;
      }
    `,
  ];

  private get statusIconClasses() {
    return {
      [statusIconVariants({ type: this.type })]: true,
      [iconColorVariants({ type: this.type })]: true,
    };
  }

  private get iconType() {
    return this.type === "success" ? "check" : "error";
  }

  private handleToolbarClose() {
    this.dispatchEvent(
      new CustomEvent("status-modal-close", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          action: "toolbar-close",
        },
      }),
    );
  }

  private handlePrimaryAction() {
    this.dispatchEvent(
      new CustomEvent("status-modal-action", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          action: "primary",
          type: this.type,
        },
      }),
    );
  }

  private handleSecondaryAction() {
    this.dispatchEvent(
      new CustomEvent("status-modal-action", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          action: "secondary",
          type: this.type,
        },
      }),
    );
  }

  private handleBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.handleToolbarClose();
    }
  }

  private handleContentClick(event: Event) {
    event.stopPropagation();
  }

  override render() {
    return html`
      <div
        class="flex min-h-screen items-center justify-center p-16"
        @click=${this.handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-title"
        aria-describedby="${this.description ? "status-description" : ""}"
      >
        <div class="modal-content" @click=${this.handleContentClick}>
          <!-- Toolbar -->
          <ledger-toolbar-molecule
            @toolbar-close=${this.handleToolbarClose}
          ></ledger-toolbar-molecule>

          <!-- Content -->
          <div class="px-24 pb-24 text-center">
            <!-- Status Icon -->
            <div class="mb-32 flex justify-center">
              <div
                class=${classMap(this.statusIconClasses)}
                role="img"
                aria-label="${this.type === "success" ? "Success" : "Error"}"
              >
                <ledger-icon-atom
                  type=${this.iconType}
                  size="large"
                  class="status-icon"
                ></ledger-icon-atom>
              </div>
            </div>

            <!-- Title -->
            ${this.title
              ? html`
                  <h2
                    id="status-title"
                    class="text-20 font-semibold mb-8 font-inter text-white"
                  >
                    ${this.title}
                  </h2>
                `
              : ""}

            <!-- Description -->
            ${this.description
              ? html`
                  <p
                    id="status-description"
                    class="text-14 text-gray-400 mb-32 font-inter"
                  >
                    ${this.description}
                  </p>
                `
              : ""}

            <!-- Actions -->
            <div class="space-y-12">
              ${this.showSecondaryButton
                ? html`
                    <ledger-button-atom
                      label=${this.secondaryButtonLabel}
                      variant="secondary"
                      size="large"
                      class="w-full"
                      @ledger-button-click=${this.handleSecondaryAction}
                    ></ledger-button-atom>
                  `
                : ""}

              <ledger-button-atom
                label=${this.primaryButtonLabel}
                variant="primary"
                size="large"
                class="w-full"
                @ledger-button-click=${this.handlePrimaryAction}
              ></ledger-button-atom>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-status-modal-organism": LedgerStatusModalOrganism;
  }
}

export default LedgerStatusModalOrganism;
