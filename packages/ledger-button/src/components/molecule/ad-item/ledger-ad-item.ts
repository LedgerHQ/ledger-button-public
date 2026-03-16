import "../../atom/button/ledger-button.js";

import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

const connectionItemVariants = cva(
  [
    "flex items-center justify-between rounded-md group",
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

@customElement("ledger-ad-item")
@tailwindElement()
export class LedgerAdItem extends LitElement {
  @property({ type: String })
  override title = "";

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
      new CustomEvent("ad-item-click", {
        bubbles: true,
        composed: true,
        detail: {
          title: this.title,
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

  private renderChevron() {
    return html`
      <div
        class="group-hover:translate-x-1 pr-2 transition-transform duration-150 ease-in-out"
      >
        <ledger-icon type="chevronRight" size="small"></ledger-icon>
      </div>
    `;
  }

  private renderTitle() {
    return html`
      ${this.title
        ? html`<span class="py-8 text-base body-2"
            >${this.title}</span
          >`
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
          <div
            class="rounded-full bg-muted-transparent p-8 drop-shadow-md"
          >
            <ledger-icon type="cart" size="small"></ledger-icon>
          </div>
          ${this.renderTitle()}
        </div>
        ${this.renderChevron()}
      </button>
    `;
  }
}
