import "../../atom/icon/ledger-icon";

import { cva } from "class-variance-authority";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

export type StatusCardState = "processing" | "validated";

export interface LedgerStatusCardAttributes {
  state?: StatusCardState;
  title?: string;
  description?: string;
}

const spotVariants = cva(
  [
    "flex h-48 w-48 shrink-0 items-center justify-center rounded-full",
    "bg-muted-transparent",
  ],
  {
    variants: {
      state: {
        processing: "text-muted",
        validated: "text-success",
      },
    },
    defaultVariants: {
      state: "processing",
    },
  },
);

const styles = css`
  :host {
    display: block;
    width: 100%;
  }
`;

@customElement("ledger-status-card")
@tailwindElement(styles)
export class LedgerStatusCard extends LitElement {
  @property({ type: String })
  state: StatusCardState = "processing";

  @property({ type: String })
  override title = "";

  @property({ type: String })
  description = "";

  private get spotClasses() {
    return {
      [spotVariants({ state: this.state })]: true,
    };
  }

  private get iconType() {
    return this.state === "validated" ? "checkMarkCircleFill" : "clock";
  }

  override render() {
    return html`
      <div
        class="bg-muted-transparent flex w-full items-center gap-12 rounded-lg p-12"
        role="status"
        aria-live="polite"
      >
        <div class=${classMap(this.spotClasses)} aria-hidden="true">
          <ledger-icon
            .type=${this.iconType}
            size="20"
            fillColor="currentColor"
          ></ledger-icon>
        </div>
        <div class="flex min-w-0 flex-col gap-4 text-left">
          ${this.title
            ? html`
                <span class="body-2-semi-bold text-base"> ${this.title} </span>
              `
            : ""}
          ${this.description
            ? html`
                <span class="text-muted body-3"> ${this.description} </span>
              `
            : ""}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-status-card": LedgerStatusCard;
  }
}

export default LedgerStatusCard;
