import { cva } from "class-variance-authority";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element";

export type TabItem = {
  id: string;
  label: string;
  badge?: number;
};

export type TabChangeEventDetail = {
  selectedId: string;
  previousId: string;
  timestamp: number;
};

export interface LedgerTabsAttributes {
  tabs?: TabItem[];
  selectedId?: string;
}

const containerVariants = cva([
  "border-muted-subtle flex w-full gap-4 rounded-md border p-4",
]);

const tabVariants = cva(
  [
    "body-2-semi-bold align-self-stretch flex h-40 flex-1 shrink-0 cursor-pointer items-center justify-center gap-8 rounded-sm px-4 py-8 transition-all duration-200 ease-in-out",
  ],
  {
    variants: {
      selected: {
        true: ["bg-muted text-base"],
        false: ["text-muted hover:bg-muted-transparent-hover bg-transparent"],
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

const styles = css`
  :host {
    display: block;
  }
`;

@customElement("ledger-tabs")
@tailwindElement(styles)
export class LedgerTabs extends LitElement {
  @property({ attribute: false })
  tabs: TabItem[] = [];

  @property({ attribute: false })
  selectedId = "";

  private handleTabClick(tab: TabItem) {
    if (tab.id === this.selectedId) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent<TabChangeEventDetail>("tab-change", {
        bubbles: true,
        composed: true,
        detail: {
          selectedId: tab.id,
          previousId: this.selectedId,
          timestamp: Date.now(),
        },
      }),
    );
  }

  private handleKeydown(event: KeyboardEvent, tab: TabItem) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleTabClick(tab);
    }
  }

  private renderBadge(count: number) {
    return html`
      <span
        class="bg-error-strong flex h-16 w-16 items-center justify-center rounded-full px-4 text-white"
      >
        <span class="body-3">${count}</span>
      </span>
    `;
  }

  private renderTab(tab: TabItem) {
    const isSelected = tab.id === this.selectedId;

    return html`
      <button
        class=${tabVariants({ selected: isSelected })}
        role="tab"
        aria-selected=${isSelected}
        tabindex=${isSelected ? 0 : -1}
        @click=${() => this.handleTabClick(tab)}
        @keydown=${(e: KeyboardEvent) => this.handleKeydown(e, tab)}
      >
        ${tab.label}${tab.badge ? this.renderBadge(tab.badge) : ""}
      </button>
    `;
  }

  override render() {
    return html`
      <div class=${containerVariants()} role="tablist">
        ${this.tabs.map((tab) => this.renderTab(tab))}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-tabs": LedgerTabs;
  }

  interface WindowEventMap {
    "tab-change": CustomEvent<TabChangeEventDetail>;
  }
}

export default LedgerTabs;
