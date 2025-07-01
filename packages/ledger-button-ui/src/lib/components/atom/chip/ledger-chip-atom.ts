import "../icon/ledger-icon-atom";

import { cva } from "class-variance-authority";
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import tailwindStyles from "../../../../styles.css?inline";

export interface LedgerChipAtomAttributes {
  label?: string;
  disabled?: boolean;
  icon?: "device";
}

const chipContainerVariants = cva(
  [
    "flex cursor-pointer items-center justify-center gap-8 rounded-full px-16 py-8",
    "bg-interactive-pressed",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      disabled: {
        true: "pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      disabled: false,
    },
  },
);

const chipLabelVariants = cva(["text-on-interactive body-2"]);

const chipIconContainerVariants = cva([
  "flex h-24 w-24 items-center justify-center rounded-full p-12",
  "bg-muted-strong-pressed",
]);

const chipChevronVariants = cva(["rotate-90"]);

@customElement("ledger-chip-atom")
export class LedgerChipAtom extends LitElement {
  @property({ type: String })
  label = "";

  @property({ type: Boolean })
  disabled = false;

  @property({ type: String })
  icon = "device";

  static override styles = [unsafeCSS(tailwindStyles)];

  private get chipContainerClasses() {
    return {
      [chipContainerVariants({
        disabled: this.disabled,
      })]: true,
    };
  }

  private get chipLabelClasses() {
    return {
      [chipLabelVariants()]: true,
    };
  }

  private get chipIconContainerClasses() {
    return {
      [chipIconContainerVariants()]: true,
    };
  }

  private get chipChevronClasses() {
    return {
      [chipChevronVariants()]: true,
    };
  }

  private renderIcon() {
    return html`
      <div class=${classMap(this.chipIconContainerClasses)}>
        <ledger-icon-atom type=${this.icon} size="medium"></ledger-icon-atom>
      </div>
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
      <button
        class=${classMap(this.chipContainerClasses)}
        tabindex=${this.disabled ? -1 : 0}
        aria-label="${this.label}"
        aria-disabled=${this.disabled}
        @click=${this.handleClick}
        @keydown=${this.handleKeydown}
      >
        ${this.renderIcon()}
        <span class=${classMap(this.chipLabelClasses)}>${this.label}</span>
        ${this.renderChevron()}
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
      new CustomEvent("ledger-chip-click", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
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
