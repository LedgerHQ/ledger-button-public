import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

const platformItemVariants = cva(
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

export type PlatformItemClickEventDetail = {
  platformType: "mobile" | "desktop";
};

@customElement("ledger-platform-item")
@tailwindElement()
export class LedgerPlatformItem extends LitElement {
  @property({ type: String })
  override title = "";

  @property({ type: String, attribute: "platform-type" })
  platformType: "mobile" | "desktop" = "mobile";

  @property({ type: Boolean })
  clickable = true;

  @property({ type: Boolean })
  disabled = false;

  private get containerClasses() {
    return {
      [platformItemVariants({
        clickable: this.clickable,
        disabled: this.disabled,
      })]: true,
    };
  }

  private handleClick() {
    if (this.disabled || !this.clickable) return;

    this.dispatchEvent(
      new CustomEvent<PlatformItemClickEventDetail>(
        "ledger-platform-item-click",
        {
          bubbles: true,
          composed: true,
          detail: {
            platformType: this.platformType,
          },
        },
      ),
    );
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (this.disabled || !this.clickable) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleClick();
    }
  }

  private renderPlatformIcon() {
    return html`
      <div
        class="rounded-full bg-muted-transparent p-8 drop-shadow-md"
      >
        <ledger-icon
          type=${this.platformType}
          size="small"
          fillColor="white"
        ></ledger-icon>
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

  private renderChevron() {
    return html`
      <div
        class="pr-2 transition-transform duration-150 ease-in-out group-hover:translate-x-1"
      >
        <ledger-icon type="chevronRight" size="small"></ledger-icon>
      </div>
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
          ${this.renderPlatformIcon()}
          <div class="flex flex-col items-start gap-4">
            ${this.renderTitle()}
          </div>
        </div>
        ${this.renderChevron()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-platform-item": LedgerPlatformItem;
  }
}

export default LedgerPlatformItem;
