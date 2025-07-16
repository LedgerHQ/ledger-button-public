import "../icon/ledger-icon";

import { cva } from "class-variance-authority";
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import tailwindStyles from "../../../../styles.css?inline";

export interface LedgerChipAttributes {
  label?: string;
  icon?: "device";
}

const chipContainerVariants = cva([
  "flex h-40 cursor-pointer items-center justify-center gap-8 rounded-full px-16 py-8",
  "bg-interactive-pressed",
]);

const chipLabelVariants = cva(["text-on-interactive body-2"]);

const chipIconContainerVariants = cva([
  "flex h-24 w-24 items-center justify-center rounded-full p-12",
  "bg-muted-strong-pressed",
]);

const chipChevronVariants = cva(["rotate-90"]);

@customElement("ledger-chip")
export class LedgerChip extends LitElement {
  @property({ type: String })
  label = "";

  @property({ type: String })
  icon = "device";

  static override styles = [unsafeCSS(tailwindStyles)];

  private get chipContainerClasses() {
    return {
      [chipContainerVariants()]: true,
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
        <ledger-icon type=${this.icon} size="medium"></ledger-icon>
      </div>
    `;
  }

  private renderChevron() {
    return html`
      <div class=${classMap(this.chipChevronClasses)}>
        <ledger-icon type="chevron" size="medium"></ledger-icon>
      </div>
    `;
  }

  override render() {
    return html`
      <button
        class=${classMap(this.chipContainerClasses)}
        aria-label="${this.label}"
        @click=${this.handleClick}
        @keydown=${this.handleKeydown}
      >
        ${this.renderIcon()}
        <span class=${classMap(this.chipLabelClasses)}>${this.label}</span>
        ${this.renderChevron()}
      </button>
    `;
  }

  private handleClick() {
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
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleClick();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-chip": LedgerChip;
  }
}

export default LedgerChip;
