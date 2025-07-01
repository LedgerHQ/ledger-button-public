import "../icon/ledger-icon-atom";

import { cva } from "class-variance-authority";
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import tailwindStyles from "../../../../styles.css?inline";

export type ChipVariant = "default" | "selected";

export interface LedgerChipAtomAttributes {
  label?: string;
  variant?: ChipVariant;
  disabled?: boolean;
  icon?: "device";
}

const chipContainerVariants = cva(
  [
    "flex cursor-pointer items-center justify-center gap-8 rounded-full px-16 py-8",
    "transition-all duration-200 ease-in-out",
    "min-w-fit whitespace-nowrap",
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
      disabled: {
        true: "pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      disabled: false,
    },
  },
);

const chipLabelVariants = cva([
  "flex-1 overflow-hidden text-ellipsis whitespace-nowrap",
]);

const chipIconVariants = cva(["flex-shrink-0"]);

const chipChevronVariants = cva([
  "flex-shrink-0 rotate-90 transition-transform duration-200 ease-in-out",
  "[&_svg_path]:stroke-current",
]);

@customElement("ledger-chip-atom")
export class LedgerChipAtom extends LitElement {
  @property({ type: String })
  label = "";

  @property({ type: String })
  variant: ChipVariant = "default";

  @property({ type: Boolean })
  disabled = false;

  @property({ type: String })
  icon = "device";

  static override styles = [unsafeCSS(tailwindStyles)];

  private get hostClasses() {
    return "inline-block";
  }

  private get chipContainerClasses() {
    return {
      [chipContainerVariants({
        variant: this.variant,
        disabled: this.disabled,
      })]: true,
    };
  }

  private get chipLabelClasses() {
    return {
      [chipLabelVariants()]: true,
    };
  }

  private get chipIconClasses() {
    return {
      [chipIconVariants()]: true,
    };
  }

  private get chipChevronClasses() {
    return {
      [chipChevronVariants()]: true,
    };
  }

  private renderIcon() {
    return html`
      <ledger-icon-atom
        type=${this.icon}
        size="medium"
        class=${classMap(this.chipIconClasses)}
      ></ledger-icon-atom>
    `;
  }

  private renderChevron() {
    return html`
      <div class=${classMap(this.chipChevronClasses)}>
        <ledger-icon-atom type="chevron" size="medium"></ledger-icon-atom>
      </div>
    `;
  }

  override render() {
    return html`
      <div class=${this.hostClasses}>
        <div
          class=${classMap(this.chipContainerClasses)}
          role="button"
          tabindex=${this.disabled ? -1 : 0}
          aria-label="${this.label}"
          aria-disabled=${this.disabled}
          @click=${this.handleClick}
          @keydown=${this.handleKeydown}
        >
          ${this.renderIcon()}
          <span class=${classMap(this.chipLabelClasses)}>${this.label}</span>
          ${this.renderChevron()}
        </div>
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
