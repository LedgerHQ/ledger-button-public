import "../icon/ledger-icon-atom";

import { cva } from "class-variance-authority";
import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import tailwindStyles from "../../../../styles.css?inline";

export type ChipSize = "small" | "medium" | "large";
export type ChipVariant = "default" | "selected";

export interface LedgerChipAtomAttributes {
  label?: string;
  size?: ChipSize;
  variant?: ChipVariant;
  disabled?: boolean;
  icon?: string;
}

const chipVariants = cva(
  [
    "flex cursor-pointer items-center justify-center gap-8 rounded-full",
    "transition-all duration-200 ease-in-out",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "hover:bg-opacity-80 active:bg-opacity-90",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-grey-800 text-grey-050",
          "hover:bg-grey-700 active:bg-grey-900",
        ],
        selected: [
          "bg-grey-700 text-grey-050",
          "hover:bg-grey-600 active:bg-grey-800",
        ],
      },
      size: {
        small: ["py-6 px-12", "text-12 font-medium"],
        medium: ["px-16 py-8", "text-14 font-medium"],
        large: ["px-20 py-10", "text-16 font-medium"],
      },
    },
    defaultVariants: {
      variant: "default",
      size: "medium",
    },
  },
);

@customElement("ledger-chip-atom")
export class LedgerChipAtom extends LitElement {
  @property({ type: String })
  label = "";

  @property({ type: String })
  size: ChipSize = "medium";

  @property({ type: String })
  variant: ChipVariant = "default";

  @property({ type: Boolean })
  disabled = false;

  @property({ type: String })
  icon = "ledger";

  static override styles = [
    unsafeCSS(tailwindStyles),
    css`
      :host {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .chip-container {
        min-width: fit-content;
        white-space: nowrap;
      }

      .chip-icon {
        flex-shrink: 0;
      }

      .chip-label {
        flex: 1;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }

      .chip-chevron {
        flex-shrink: 0;
        transform: rotate(90deg);
        transition: transform 0.2s ease-in-out;
      }

      .chip-chevron svg path {
        stroke: currentColor;
      }
    `,
  ];

  private get chipClasses() {
    return {
      [chipVariants({ variant: this.variant, size: this.size })]: true,
      "chip-container": true,
    };
  }

  private get iconSize() {
    const sizeMap = {
      small: "small" as const,
      medium: "small" as const,
      large: "medium" as const,
    };
    return sizeMap[this.size];
  }

  private renderIcon() {
    return html`
      <ledger-icon-atom
        type=${this.icon}
        size=${this.iconSize}
        class="chip-icon"
      ></ledger-icon-atom>
    `;
  }

  private renderChevron() {
    return html`
      <div class="chip-chevron">
        <ledger-icon-atom type="chevron" size="small"></ledger-icon-atom>
      </div>
    `;
  }

  override render() {
    return html`
      <div
        class=${classMap(this.chipClasses)}
        role="button"
        tabindex=${this.disabled ? -1 : 0}
        aria-label="${this.label}"
        aria-disabled=${this.disabled}
        @click=${this.handleClick}
        @keydown=${this.handleKeydown}
      >
        ${this.renderIcon()}
        <span class="chip-label">${this.label}</span>
        ${this.renderChevron()}
      </div>
    `;
  }

  private handleClick(event: Event) {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.dispatchEvent(
      new CustomEvent("ledger-chip-click", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          variant: this.variant,
          size: this.size,
          label: this.label,
          icon: this.icon,
        },
      }),
    );
  }

  private handleKeydown(event: KeyboardEvent) {
    if (this.disabled) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleClick(event);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-chip-atom": LedgerChipAtom;
  }
}

export default LedgerChipAtom;
