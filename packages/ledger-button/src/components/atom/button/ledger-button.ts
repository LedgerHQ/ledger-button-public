import "../icon/ledger-icon";

import { cva } from "class-variance-authority";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";
import { LedgerIconAttributes } from "../icon/ledger-icon.js";

export type ButtonVariant = "primary" | "secondary" | "accent" | "noBackground";
export type ButtonSize = "small" | "medium" | "large" | "xs" | "full";
export type IconPosition = "left" | "right";

export interface LedgerButtonAttributes {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: boolean;
  iconPosition?: IconPosition;
  type?: "button" | "submit" | "reset";
}

const buttonVariants = cva(
  [
    "flex cursor-pointer items-center justify-center gap-8 rounded-full body-1-semi-bold",
    "disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled",
  ],
  {
    variants: {
      variant: {
        accent: [
          "bg-accent text-on-accent",
          "hover:bg-accent-hover active:bg-accent-pressed",
        ],
        primary: [
          "bg-interactive text-on-interactive",
          "hover:bg-interactive-hover active:bg-interactive-pressed",
        ],
        secondary: [
          "bg-muted text-base",
          "hover:bg-muted-hover active:bg-muted-pressed",
        ],
        "secondary-transparent": [
          "bg-muted-transparent text-base",
          "hover:bg-muted-transparent-hover active:bg-muted-transparent-pressed",
        ],
        noBackground: [
          "bg-base-transparent text-base",
          "hover:bg-base-transparent-hover active:bg-base-transparent-pressed",
        ],
      },
      size: {
        xs: ["p-8"],
        small: ["px-16 py-8", "body-2-semi-bold"],
        medium: ["p-16"],
        large: ["px-32 py-16"],
        full: ["w-full", "h-56"],
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "medium",
    },
  },
);

const styles = css`
  :host {
    display: block;
  }

  :host([disabled]) {
    pointer-events: none;
  }
`;

@customElement("ledger-button")
@tailwindElement(styles)
export class LedgerButton extends LitElement {
  @property({ type: String })
  label = "";

  @property({ type: String })
  variant: ButtonVariant = "primary";

  @property({ type: String })
  size: ButtonSize = "medium";

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  icon = false;

  @property({ type: String })
  iconType?: LedgerIconAttributes["type"];

  @property({ type: String, attribute: "icon-position" })
  iconPosition: IconPosition = "left";

  @property({ type: String })
  type: "button" | "submit" | "reset" = "button";

  private get buttonClasses() {
    return {
      [buttonVariants({ variant: this.variant, size: this.size })]: true,
    };
  }

  private renderIcon() {
    if (!this.icon) {
      return nothing;
    }

    const fillColor = this.variant === "primary" ? "black" : "white";
    const size = this.size === "xs" ? "small" : this.size;

    return html`
      <ledger-icon
        .type=${this.iconType ?? "ledger"}
        size=${size}
        class="text-base"
        .fillColor=${fillColor}
      >
      </ledger-icon>
    `;
  }

  private renderLabel() {
    if (this.label === "") {
      return nothing;
    }

    return html`<span class="body-2">${this.label}</span>`;
  }

  override render() {
    return html`
      <button
        type="${this.type}"
        class=${classMap(this.buttonClasses)}
        ?disabled=${this.disabled}
        aria-label="${this.label}"
        @click=${this.handleClick}
      >
        ${this.iconPosition === "left" && this.icon
          ? html`${this.renderIcon()}${this.renderLabel()}`
          : ""}
        ${this.iconPosition === "right" && this.icon
          ? html`${this.renderLabel()}${this.renderIcon()}`
          : ""}
        ${!this.icon ? this.renderLabel() : nothing}
      </button>
    `;
  }

  private handleClick(event: Event) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();

      return;
    }

    this.dispatchEvent(
      new CustomEvent("ledger-button-click", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          variant: this.variant,
          size: this.size,
          label: this.label,
        },
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-button": LedgerButton;
  }

  interface WindowEventMap {
    "ledger-button-click": CustomEvent<{
      timestamp: number;
      variant: ButtonVariant;
      size: ButtonSize;
      label: string;
    }>;
  }
}

export default LedgerButton;
