import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import tailwindStyles from "../styles.css?inline";

export interface LedgerButtonUIAttributes {
  label?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
}

@customElement("ledger-button-ui")
export class LedgerButtonUI extends LitElement {
  @property({ type: String })
  label = "Connect Ledger";

  @property({ type: Boolean })
  disabled = false;

  @property({ type: String })
  variant: "primary" | "secondary" | "outline" = "primary";

  @property({ type: String })
  size: "small" | "medium" | "large" = "medium";

  static override styles = [
    unsafeCSS(tailwindStyles),
    css`
      :host {
        display: inline-block;
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

    const sizeClasses = {
      small: ["px-3", "py-2", "text-sm"],
      medium: ["px-4", "py-2", "text-base"],
      large: ["px-6", "py-3", "text-lg"],
    };

    const variantClasses = {
      primary: [
        "bg-black",
        "text-white",
        "hover:bg-gray-800",
        "focus:ring-gray-500",
        "disabled:bg-gray-300",
        "disabled:text-gray-500",
      ],
      secondary: [
        "bg-gray-100",
        "text-gray-900",
        "hover:bg-gray-200",
        "focus:ring-gray-400",
        "disabled:bg-gray-50",
        "disabled:text-gray-400",
      ],
      outline: [
        "bg-transparent",
        "text-gray-900",
        "border",
        "border-gray-300",
        "hover:bg-gray-50",
        "focus:ring-gray-400",
        "disabled:bg-transparent",
        "disabled:text-gray-400",
        "disabled:border-gray-200",
      ],
    };

    const disabledClasses = this.disabled
      ? ["cursor-not-allowed"]
      : ["cursor-pointer"];

    return [
      ...baseClasses,
      ...sizeClasses[this.size],
      ...variantClasses[this.variant],
      ...disabledClasses,
    ].join(" ");
  }

  override render() {
    return html`
      <button
        class="${this.buttonClasses}"
        ?disabled="${this.disabled}"
        @click="${this._handleClick}"
      >
        <div class="flex items-center">
          <div class="w-4 h-4 mr-2 border-2 border-current rounded-sm relative">
            <div
              class="absolute inset-1 border border-current rounded-xs"
            ></div>
          </div>
          ${this.label}
        </div>
      </button>
    `;
  }

  private _handleClick() {
    if (!this.disabled) {
      this.dispatchEvent(
        new CustomEvent("ledger-button-click", {
          bubbles: true,
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
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-button-ui": LedgerButtonUI;
  }
}

export default LedgerButtonUI;
