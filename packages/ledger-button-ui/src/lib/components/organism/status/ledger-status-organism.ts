import "../../atom/button/ledger-button-atom";
import "../../atom/icon/ledger-icon-atom";
import "../../molecule/toolbar/ledger-toolbar-molecule";

import { cva } from "class-variance-authority";
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import tailwindStyles from "../../../../styles.css?inline";

export type StatusType = "success" | "error";

export interface LedgerStatusOrganismAttributes {
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

@customElement("ledger-status-organism")
export class LedgerStatusOrganism extends LitElement {
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

  static override styles = [unsafeCSS(tailwindStyles)];

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
      new CustomEvent("status-close", {
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
      new CustomEvent("status-action", {
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
      new CustomEvent("status-action", {
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

  override render() {
    return html`
      <div class="bg-gray-900 rounded-3xl w-full max-w-sm overflow-auto">
        <ledger-toolbar-molecule
          @toolbar-close=${this.handleToolbarClose}
        ></ledger-toolbar-molecule>

        <div class="px-6 pb-6 text-center">
          <div class="mb-8 flex justify-center">
            <div
              class=${classMap(this.statusIconClasses)}
              role="img"
              aria-label="${this.type === "success" ? "Success" : "Error"}"
            >
              <ledger-icon-atom
                type=${this.iconType}
                size="large"
                class="text-inherit"
              ></ledger-icon-atom>
            </div>
          </div>

          ${this.title
            ? html`
                <h2
                  id="status-title"
                  class="text-xl font-semibold mb-2 font-inter text-white"
                >
                  ${this.title}
                </h2>
              `
            : ""}
          ${this.description
            ? html`
                <p
                  id="status-description"
                  class="text-sm text-gray-400 mb-8 font-inter"
                >
                  ${this.description}
                </p>
              `
            : ""}

          <div class="space-y-3">
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-status-organism": LedgerStatusOrganism;
  }
}

export default LedgerStatusOrganism;
