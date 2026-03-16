import { cva } from "class-variance-authority";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";

export type TabItem = {
  id: string;
  label: string;
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
  "flex w-full gap-4 rounded-md border border-muted-subtle p-4",
]);

const tabVariants = cva(
  [
    "body-2-semi-bold align-self-stretch flex h-40 flex-1 flex-shrink-0 cursor-pointer items-center justify-center rounded-sm px-4 py-8 transition-all duration-200 ease-in-out body-2-semi-bold",
  ],
  {
    variants: {
      selected: {
        true: ["bg-muted text-base"],
        false: [
          "bg-transparent text-muted hover:bg-muted-transparent-hover",
        ],
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
        ${tab.label}
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
