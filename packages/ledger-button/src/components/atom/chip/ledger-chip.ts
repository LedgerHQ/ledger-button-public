import "../icon/ledger-icon";
import "../icon/device-icon/device-icon.js";

import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";
import { DeviceModelId } from "../icon/device-icon/device-icon.js";

export interface LedgerChipAttributes {
  label?: string;
  icon?: "device";
}

const chipContainerVariants = cva([
  "flex h-40 max-w-208 cursor-pointer items-center justify-center gap-8 rounded-full px-16 py-8",
  "bg-muted-transparent hover:bg-muted-transparent-hover active:bg-muted-transparent-pressed",
]);

const chipLabelVariants = cva(["text-ellipsis text-base body-2"]);

const chipChevronVariants = cva(["rotate-90"]);

@customElement("ledger-chip")
@tailwindElement()
export class LedgerChip extends LitElement {
  @property({ type: String })
  label = "";

  @property({ type: String })
  deviceModelId: DeviceModelId = "flex";

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

  private get chipChevronClasses() {
    return {
      [chipChevronVariants()]: true,
    };
  }

  private renderIcon() {
    return html` <device-icon .modelId=${this.deviceModelId}></device-icon> `;
  }

  private renderChevron() {
    return html`
      <div class=${classMap(this.chipChevronClasses)}>
        <ledger-icon type="chevronRight" size="medium"></ledger-icon>
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
          deviceModelId: this.deviceModelId,
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

  interface WindowEventMap {
    "ledger-chip-click": CustomEvent<{
      timestamp: number;
      label: string;
      deviceModelId: DeviceModelId;
    }>;
  }
}

export default LedgerChip;
