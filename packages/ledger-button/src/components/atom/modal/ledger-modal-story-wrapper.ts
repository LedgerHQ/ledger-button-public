import { cva } from "class-variance-authority";
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element";
import type { ModalGradient } from "./ledger-modal";

const gradientOverlayVariants = cva(
  "pointer-events-none absolute inset-0",
  {
    variants: {
      gradient: {
        success: "bg-gradient-success",
        error: "bg-gradient-error",
      },
    },
  },
);

@customElement("ledger-modal-story-wrapper")
@tailwindElement()
export class LedgerModalStoryWrapper extends LitElement {
  @property({ type: String })
  override title = "";

  @property({ type: Boolean })
  showClose = true;

  @property({ type: Boolean })
  showLogo = true;

  @property({ type: String })
  gradient?: ModalGradient;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("ledger-status-show", this.handleStatusShow);
    this.addEventListener("ledger-status-hide", this.handleStatusHide);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("ledger-status-show", this.handleStatusShow);
    this.removeEventListener("ledger-status-hide", this.handleStatusHide);
  }

  private handleStatusShow = (event: Event): void => {
    const detail = (event as CustomEvent<{ type: ModalGradient }>).detail;
    this.gradient = detail.type;
  };

  private handleStatusHide = (): void => {
    this.gradient = undefined;
  };

  private renderGradientOverlay() {
    if (!this.gradient) {
      return nothing;
    }

    return html`
      <div
        class=${gradientOverlayVariants({ gradient: this.gradient })}
        aria-hidden="true"
      ></div>
    `;
  }

  override render() {
    return html`
      <div
        class="z-10 fixed inset-0 flex flex-col self-center justify-self-center overflow-hidden rounded-xl bg-canvas-sheet"
        @click=${(e: Event) => e.stopPropagation()}
        style="width: min(calc(100% - 32px), 400px); max-height: 550px"
      >
        ${this.renderGradientOverlay()}
        <slot name="toolbar">
          <ledger-toolbar
            title=${this.title}
            aria-label=${this.title}
          ></ledger-toolbar>
        </slot>
        <div class="overflow-y-auto text-base">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
