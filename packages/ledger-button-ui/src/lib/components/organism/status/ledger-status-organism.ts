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

const statusVariants = cva(["max-w-sm"], {
  variants: {
    type: {
      success: "",
      error: "",
    },
  },
  defaultVariants: {
    type: "success",
  },
});

const statusIconVariants = cva(
  ["flex h-64 w-64 items-center justify-center rounded-full p-12"],
  {
    variants: {
      type: {
        success: "bg-success",
        error: "bg-error",
      },
    },
    defaultVariants: {
      type: "success",
    },
  },
);

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

  static override styles = [unsafeCSS(tailwindStyles)];

  private get containerClasses() {
    return {
      [statusVariants({ type: this.type })]: true,
    };
  }

  private get statusIconClasses() {
    return {
      [statusIconVariants({ type: this.type })]: true,
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
      <div class=${classMap(this.containerClasses)}>
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
              ></ledger-icon-atom>
            </div>
          </div>

          ${this.title
            ? html`
                <h2
                  id="status-title"
                  class="heading-4-semi-bold mb-8 mt-24 text-white"
                >
                  ${this.title}
                </h2>
              `
            : ""}
          ${this.description
            ? html`
                <p id="status-description" class="text-muted body-2">
                  ${this.description}
                </p>
              `
            : ""}

          <div class="space-y-3 mt-32">
            ${this.secondaryButtonLabel
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
