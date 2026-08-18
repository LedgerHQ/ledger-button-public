import "../../atom/button/ledger-button";
import "../../atom/icon/ledger-icon";

import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element";

export type StatusType = "success" | "error" | "info";

export interface LedgerStatusAttributes {
  type?: StatusType;
  title?: string;
  description?: string;
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  showSecondaryButton?: boolean;
}

const spotVariants = cva(
  [
    "flex h-72 w-72 shrink-0 items-center justify-center rounded-full",
    "bg-muted-transparent",
  ],
  {
    variants: {
      type: {
        success: "text-success",
        error: "text-error",
        info: "text-base",
      },
    },
    defaultVariants: {
      type: "success",
    },
  },
);

@customElement("ledger-status")
@tailwindElement()
export class LedgerStatus extends LitElement {
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

  @property({ type: Boolean, attribute: "primary-first" })
  primaryFirst = false;

  private get iconType() {
    if (this.type === "success") {
      return "checkMarkCircleFill";
    }

    if (this.type === "info") {
      return "info";
    }

    return "deleteCircleFill";
  }

  private get statusSpotAriaLabel() {
    if (this.type === "success") {
      return "Success";
    }

    if (this.type === "info") {
      return "Information";
    }

    return "Error";
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

  private renderSecondaryButton() {
    if (!this.secondaryButtonLabel) {
      return "";
    }

    return html`
      <ledger-button
        label=${this.secondaryButtonLabel}
        variant="secondary"
        size="full"
        @ledger-button-click=${this.handleSecondaryAction}
      ></ledger-button>
    `;
  }

  private renderPrimaryButton() {
    if (!this.primaryButtonLabel) {
      return "";
    }

    return html`
      <ledger-button
        label=${this.primaryButtonLabel}
        variant="primary"
        size="full"
        @ledger-button-click=${this.handlePrimaryAction}
      ></ledger-button>
    `;
  }

  private renderActions() {
    if (!this.primaryButtonLabel && !this.secondaryButtonLabel) {
      return "";
    }

    const buttons = this.primaryFirst
      ? html`${this.renderPrimaryButton()} ${this.renderSecondaryButton()}`
      : html`${this.renderSecondaryButton()} ${this.renderPrimaryButton()}`;

    return html`
      <div class="flex flex-col gap-16 self-stretch">
        ${buttons}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="flex max-w-sm flex-col gap-32">
        <div class="flex flex-col items-center gap-24">
          <div
            class=${spotVariants({ type: this.type })}
            role="img"
            aria-label="${this.statusSpotAriaLabel}"
          >
            <ledger-icon
              .type=${this.iconType}
              .size=${32}
              fillColor="currentColor"
            ></ledger-icon>
          </div>
          <div
            class="flex flex-col items-center gap-12 self-stretch text-center"
          >
            ${this.title
              ? html`
                  <h2
                    id="status-title"
                    class="text-base heading-4-semi-bold"
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
          </div>
          <slot name="card"></slot>
          ${this.renderActions()}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-status": LedgerStatus;
  }

  interface WindowEventMap {
    "ledger-status-action": CustomEvent<{
      timestamp: number;
      action: "primary" | "secondary";
      type: StatusType;
    }>;
  }
}

export default LedgerStatus;
