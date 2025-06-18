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
    const baseClasses = ["flex", "items-center", "justify-center"];

    const sizeClasses: Record<ButtonSize, string[]> = {
      small: [
        "w-[104px]",
        "h-[32px]",
        "text-[14px]",
        "p[8px 10px]",
        "gap-[8px]",
        "rounded-sm",
      ],
      medium: [
        "w-[152px]",
        "h-[36px]",
        "text-[14px]",
        "p[8px 10px]",
        "gap-[8px]",
        "rounded-md",
      ],
      large: [
        "w-[416px]",
        "h-[88px]",
        "text-[28px]",
        "p[12px 16px]",
        "gap-[12px]",
        "rounded-lg",
      ],
    };

    const variantClasses: Record<
      ButtonVariant,
      { base: string[]; disabled: string[] }
    > = {
      primary: {
        base: ["bg-black", "text-white"],
        disabled: ["disabled:bg-gray-300", "disabled:text-gray-500"],
      },
      secondary: {
        base: ["bg-gray-100", "text-gray-900"],
        disabled: ["disabled:bg-gray-50", "disabled:text-gray-400"],
      },
    };

    const classes = [
      ...baseClasses,
      ...sizeClasses[this.size],
      ...variantClasses[this.variant].base,
      ...(this.disabled ? variantClasses[this.variant].disabled : []),
      ...(this.disabled ? ["cursor-not-allowed"] : ["cursor-pointer"]),
    ];

    return { button: true, [classes.join(" ")]: true };
  }

  private get iconClasses() {
    const sizeClasses = {
      small: "w-8 h-8",
      medium: "w-16 h-16",
      large: "w-32 h-32",
    };

    return sizeClasses[this.size];
  }

  // Right now this is only returning the Ledger icon
  // TODO: Add support for other icons and make it configurable (if needed)
  private renderIcon() {
    if (!this.icon) {
      return "";
    }

    return html`
      <div class="${this.iconClasses}" aria-hidden="true">
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
