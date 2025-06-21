import "../icon/ledger-icon-atom";

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

  private renderIcon() {
    if (!this.icon) {
      return "";
    }

    return html` <ledger-icon-atom type="ledger" size=${this.size} /> `;
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
