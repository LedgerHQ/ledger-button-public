import "../icon/ledger-icon-atom";

import { cva } from "class-variance-authority";
import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import tailwindStyles from "../../../../styles.css?inline";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "small" | "medium" | "large";
export type IconPosition = "left" | "right";
export interface LedgerButtonAtomAttributes {
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
      },
      size: {
        small: ["px-16 py-8", "body-2-semi-bold"],
        medium: ["p-16"],
        large: ["px-32 py-16"],
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "medium",
    },
  },
);

@customElement("ledger-button-atom")
export class LedgerButtonAtom extends LitElement {
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

  @property({ type: String, attribute: "icon-position" })
  iconPosition: IconPosition = "left";

  @property({ type: String })
  type: "button" | "submit" | "reset" = "button";

  static override styles = [
    unsafeCSS(tailwindStyles),
    css`
      :host {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
      }
    `,
  ];

  private get buttonClasses() {
    return {
      [buttonVariants({ variant: this.variant, size: this.size })]: true,
    };
  }

  private renderIcon() {
    if (!this.icon) {
      return "";
    }

    return html`<ledger-icon-atom type="ledger" size=${this.size} />`;
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
          ? html`${this.renderIcon()}<span>${this.label}</span>`
          : ""}
        ${this.iconPosition === "right" && this.icon
          ? html`<span class="font-inter">${this.label}</span
              >${this.renderIcon()}`
          : ""}
        ${!this.icon ? html`${this.label}` : ""}
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
    "ledger-button-atom": LedgerButtonAtom;
  }
}

export default LedgerButtonAtom;
