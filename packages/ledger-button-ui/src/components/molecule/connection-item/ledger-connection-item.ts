import "../../atom/icon/ledger-icon";

import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element";

const connectionItemVariants = cva(
  [
    "group flex items-center justify-between rounded-md",
    "min-w-full",
    "bg-muted p-12 transition duration-150 ease-in-out hover:bg-muted-hover",
  ],
  {
    variants: {
      clickable: {
        true: ["cursor-pointer"],
        false: ["cursor-default"],
      },
      disabled: {
        true: ["pointer-events-none cursor-not-allowed opacity-50"],
        false: [],
      },
    },
    defaultVariants: {
      clickable: true,
      disabled: false,
    },
  },
);

export type ConnectionItemClickEventDetail = {
  title: string;
  connectionType: "bluetooth" | "usb" | "";
  timestamp: number;
};

export interface LedgerConnectionItemAttributes {
  title?: string;
  connectionType?: "bluetooth" | "usb";
  clickable?: boolean;
  disabled?: boolean;
}

@customElement("ledger-connection-item")
@tailwindElement()
export class LedgerConnectionItem extends LitElement {
  @property({ type: String })
  override title = "";

  @property({ type: String, attribute: "connection-type" })
  connectionType: "bluetooth" | "usb" | "" = "";

  @property({ type: Boolean })
  clickable = true;

  @property({ type: Boolean })
  disabled = false;

  private get containerClasses() {
    return {
      [connectionItemVariants({
        clickable: this.clickable,
        disabled: this.disabled,
      })]: true,
    };
  }
  private handleClick() {
    if (this.disabled || !this.clickable) return;

    this.dispatchEvent(
      new CustomEvent<ConnectionItemClickEventDetail>("connection-item-click", {
        bubbles: true,
        composed: true,
        detail: {
          title: this.title,
          connectionType: this.connectionType,
          timestamp: Date.now(),
        },
      }),
    );
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (this.disabled || !this.clickable) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleClick();
    }
  }

  private renderIcon() {
    if (this.connectionType) {
      return html`
        <div class="rounded-full bg-muted-transparent p-8 drop-shadow-md">
          <ledger-icon type=${this.connectionType} size="medium"></ledger-icon>
        </div>
      `;
    }
    return "";
  }

  private renderChevron() {
    return html`
      <div
        class="group-hover:translate-x-1 pr-2 transition-transform duration-150 ease-in-out"
      >
        <ledger-icon type="chevron" size="small"></ledger-icon>
      </div>
    `;
  }

  private renderTitle() {
    return html`
      ${this.title
        ? html`<span class="py-8 text-base body-2">${this.title}</span>`
        : ""}
    `;
  }

  override render() {
    return html`
      <button
        class=${classMap(this.containerClasses)}
        ?disabled=${this.disabled}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
        role="button"
        tabindex=${this.disabled ? "-1" : "0"}
        aria-label=${this.title || ""}
      >
        <div class="flex items-center gap-12">
          ${this.renderIcon()} ${this.renderTitle()}
        </div>
        ${this.renderChevron()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-connection-item": LedgerConnectionItem;
  }
}

export default LedgerConnectionItem;
