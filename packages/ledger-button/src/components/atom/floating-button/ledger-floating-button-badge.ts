import "../icon/ledger-icon";

import { cva } from "class-variance-authority";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

export type FloatingButtonBadgeVariant = "pending" | "validated";

const badgeSurfaceVariants = cva(
  "inline-flex h-24 min-w-24 items-center justify-center rounded-full",
  {
    variants: {
      variant: {
        pending: "bg-error-strong body-2-semi-bold text-white",
        validated: "bg-success-strong",
      },
    },
    defaultVariants: {
      variant: "pending",
    },
  },
);

const styles = css`
  :host {
    position: absolute;
    top: -4px;
    right: -4px;
    z-index: 20;
  }

  :host([hidden]) {
    display: none;
  }
`;

@customElement("ledger-floating-button-badge")
@tailwindElement(styles)
export class LedgerFloatingButtonBadge extends LitElement {
  @property({ type: String })
  variant: FloatingButtonBadgeVariant = "pending";

  @property({ type: Number })
  count = 0;

  private get badgeSurfaceClasses() {
    return {
      [badgeSurfaceVariants({ variant: this.variant })]: true,
    };
  }

  override render() {
    if (this.variant === "validated") {
      return html`
        <span class=${classMap(this.badgeSurfaceClasses)} aria-hidden="true">
          <ledger-icon
            type="check"
            size="small"
            fillColor="white"
          ></ledger-icon>
        </span>
      `;
    }

    return html`
      <span class=${classMap(this.badgeSurfaceClasses)}>${this.count}</span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-floating-button-badge": LedgerFloatingButtonBadge;
  }
}
