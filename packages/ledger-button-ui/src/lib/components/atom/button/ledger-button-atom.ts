import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import tailwindStyles from "../../../../styles.css?inline";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "select-button"
  | "icon-title"
  | "icon-only"
  | "title-only";
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

      .button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
        border-radius: 0.5rem;
        transition: all 0.2s ease-in-out;
        cursor: pointer;
        border: none;
        font-family: inherit;
        text-decoration: none;
        white-space: nowrap;
        user-select: none;
      }

      .button:focus {
        outline: none;
      }

      .button:focus-visible {
        outline: 2px solid var(--color-light-blue-400);
        outline-offset: 2px;
      }

      .button[disabled] {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .icon {
        width: 1.25rem;
        height: 1.25rem;
        flex-shrink: 0;
      }

      .icon-small {
        width: 1rem;
        height: 1rem;
      }

      .icon-large {
        width: 1.5rem;
        height: 1.5rem;
      }
    `,
  ];

  private get buttonClasses() {
    const baseClasses = [
      "inline-flex",
      "items-center",
      "justify-center",
      "font-medium",
      "rounded-lg",
      "transition-all",
      "duration-200",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-offset-2",
    ];

    const sizeClasses: Record<ButtonSize, string[]> = {
      small: ["px-3", "py-2", "text-sm"],
      medium: ["px-4", "py-2", "text-base"],
      large: ["px-6", "py-3", "text-lg"],
    };

    const variantClasses: Record<
      ButtonVariant,
      { base: string[]; disabled: string[] }
    > = {
      primary: {
        base: [
          "bg-black",
          "text-white",
          "hover:bg-gray-800",
          "focus:ring-gray-500",
        ],
        disabled: ["disabled:bg-gray-300", "disabled:text-gray-500"],
      },
      secondary: {
        base: [
          "bg-gray-100",
          "text-gray-900",
          "hover:bg-gray-200",
          "focus:ring-gray-400",
        ],
        disabled: ["disabled:bg-gray-50", "disabled:text-gray-400"],
      },
      "select-button": {
        base: [
          "bg-transparent",
          "text-gray-900",
          "border",
          "border-gray-300",
          "hover:bg-gray-50",
          "focus:ring-gray-400",
        ],
        disabled: [
          "disabled:bg-transparent",
          "disabled:text-gray-400",
          "disabled:border-gray-200",
        ],
      },
      "icon-title": {
        base: [
          "bg-black",
          "text-white",
          "hover:bg-gray-800",
          "focus:ring-gray-500",
        ],
        disabled: ["disabled:bg-gray-300", "disabled:text-gray-500"],
      },
      "icon-only": {
        base: [
          "bg-transparent",
          "text-gray-600",
          "hover:text-gray-900",
          "hover:bg-gray-100",
          "focus:ring-gray-400",
          "rounded-full",
        ],
        disabled: ["disabled:text-gray-400"],
      },
      "title-only": {
        base: [
          "bg-transparent",
          "text-blue-600",
          "hover:text-blue-800",
          "hover:bg-blue-50",
          "focus:ring-blue-400",
        ],
        disabled: ["disabled:text-gray-400"],
      },
    };

    const iconOnlySizeClasses: Record<ButtonSize, string[]> = {
      small: ["w-8", "h-8", "p-1"],
      medium: ["w-10", "h-10", "p-2"],
      large: ["w-12", "h-12", "p-2.5"],
    };

    const classes = [
      ...baseClasses,
      ...sizeClasses[this.size],
      ...variantClasses[this.variant].base,
      ...(this.disabled ? variantClasses[this.variant].disabled : []),
      ...(this.variant === "icon-only" ? iconOnlySizeClasses[this.size] : []),
      ...(this.disabled ? ["cursor-not-allowed"] : ["cursor-pointer"]),
    ];

    return { button: true, [classes.join(" ")]: true };
  }

  private get iconClasses() {
    return {
      icon: true,
      "icon-small": this.size === "small",
      "icon-large": this.size === "large",
    };
  }

  // Right now this is only returning the Ledger icon
  // TODO: Add support for other icons and make it configurable (if needed)
  private renderIcon() {
    if (!this.icon) {
      return "";
    }

    return html`
      <div class=${classMap(this.iconClasses)} aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clip-path="url(#clip0_149_5244)">
            <g clip-path="url(#clip1_149_5244)">
              <path
                d="M0.00195312 0V3.95062H0.878831V0.875929H6.02024V0H0.00195312ZM9.98367 0V0.875929H15.1251V3.95062H16.002V0H9.98367Z"
                fill="white"
              />
              <path
                d="M15.999 16L15.999 12.0494L15.1221 12.0494L15.1221 15.1241L9.98074 15.1241L9.98074 16L15.999 16ZM6.01731 16L6.01731 15.1241L0.8759 15.1241L0.875901 12.0494L-0.000976217 12.0494L-0.000976562 16L6.01731 16Z"
                fill="white"
              />
              <path
                d="M6.2207 10.6973V5.23486H7.0166V9.97945H9.81017V10.6973H6.2207Z"
                fill="white"
              />
            </g>
          </g>
          <defs>
            <clipPath id="clip0_149_5244">
              <rect width="16" height="16" fill="white" />
            </clipPath>
            <clipPath id="clip1_149_5244">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>
    `;
  }

  private renderContent() {
    if (this.variant === "icon-only") {
      return this.renderIcon();
    }

    if (this.variant === "title-only") {
      return html`${this.label}`;
    }

    return html`
      <div class="flex items-center">
        ${this.iconPosition === "left" && this.icon
          ? html`${this.renderIcon()}<span class="ml-2">${this.label}</span>`
          : ""}
        ${this.iconPosition === "right" && this.icon
          ? html`<span class="mr-2">${this.label}</span>${this.renderIcon()}`
          : ""}
        ${!this.icon ? html`${this.label}` : ""}
      </div>
    `;
  }

  override render() {
    return html`
      <button
        type="${this.type}"
        class=${classMap(this.buttonClasses)}
        ?disabled=${this.disabled}
        aria-label="${this.label}"
        @click=${this._handleClick}
      >
        ${this.renderContent()}
      </button>
    `;
  }

  private _handleClick(event: Event) {
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
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-button-atom": LedgerButtonAtom;
  }
}

export default LedgerButtonAtom;
