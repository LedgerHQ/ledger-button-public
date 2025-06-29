import "../../atom/icon/ledger-icon-atom";

import { cva } from "class-variance-authority";
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { when } from "lit/directives/when.js";

import tailwindStyles from "../../../../styles.css?inline";

export type ListItemVariant = "connection" | "account";
export type ListItemSize = "small" | "medium" | "large";

export interface LedgerListItemMoleculeAttributes {
  variant?: ListItemVariant;
  title?: string;
  subtitle?: string;
  amount?: string;
  currency?: string;
  iconType?: string;
  clickable?: boolean;
  disabled?: boolean;
}

const listItemVariants = cva(
  ["cursor-pointed dark flex items-center", "rounded-md"],
  {
    variants: {
      variant: {
        connection: ["h-56 w-384", "bg-base-pressed p-16"],
        account: ["h-64 w-384", "bg-canvas-sheet p-12"],
      },
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
      variant: "connection",
      clickable: true,
      disabled: false,
    },
  },
);

const iconContainerVariants = cva(
  ["flex items-center justify-center rounded-full"],
  {
    variants: {
      variant: {
        connection: ["h-32 w-32"],
        account: ["h-12 w-12"],
      },
    },
    defaultVariants: {
      variant: "connection",
    },
  },
);

const titleVariants = cva(
  [
    "text-left text-base",
    "m-0 overflow-hidden text-ellipsis whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        connection: ["body-1"],
        account: ["body-1-semi-bold"],
      },
    },
    defaultVariants: {
      variant: "connection",
    },
  },
);

const subtitleVariants = cva(
  [
    "text-muted body-2",
    "m-0 mt-2 overflow-hidden text-ellipsis whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        connection: ["text-center"],
        account: ["text-left"],
      },
    },
    defaultVariants: {
      variant: "connection",
    },
  },
);

const amountVariants = cva([
  "text-base body-1-semi-bold",
  "m-0 flex-shrink-0 text-right",
]);

const contentVariants = cva(["m-12 min-w-0 flex-1"]);

@customElement("ledger-list-item-molecule")
export class LedgerListItemMolecule extends LitElement {
  @property({ type: String })
  variant: ListItemVariant = "connection";

  @property({ type: String })
  size: ListItemSize = "medium";

  @property({ type: String })
  override title = "";

  @property({ type: String })
  subtitle = "";

  @property({ type: String })
  amount = "";

  @property({ type: String })
  currency = "";

  @property({ type: String, attribute: "icon-type" })
  iconType = "";

  @property({ type: Boolean })
  clickable = true;

  @property({ type: Boolean })
  disabled = false;

  static override styles = [unsafeCSS(tailwindStyles)];

  private get containerClasses() {
    return {
      [listItemVariants({
        variant: this.variant,
        clickable: this.clickable,
        disabled: this.disabled,
      })]: true,
    };
  }

  private get iconContainerClasses() {
    return {
      [iconContainerVariants({ variant: this.variant })]: true,
    };
  }

  private get titleClasses() {
    return {
      [titleVariants({ variant: this.variant })]: true,
    };
  }

  private get subtitleClasses() {
    return {
      [subtitleVariants({ variant: this.variant })]: true,
    };
  }

  private getIconType() {
    if (this.iconType) {
      return this.iconType;
    }

    const currencyIconMap: { [key: string]: string } = {
      ETH: "ethereum",
      BSC: "bsc",
      POL: "polygon",
      MATIC: "polygon",
    };

    return currencyIconMap[this.currency?.toUpperCase() || ""];
  }

  private renderIcon() {
    if (this.variant === "connection" && this.iconType) {
      return html`
        <div
          class="${classMap(this.iconContainerClasses)} flex-shrink-0"
          data-testid="connection-icon"
        >
          <ledger-icon-atom
            type=${this.iconType}
            size="medium"
          ></ledger-icon-atom>
        </div>
      `;
    }

    if (this.variant === "account") {
      return html`
        <div class="flex-shrink-0" data-testid="account-avatar">
          <ledger-icon-atom
            type=${this.getIconType()}
            size="large"
          ></ledger-icon-atom>
        </div>
      `;
    }

    return "";
  }

  private renderContent() {
    if (this.variant === "connection") {
      return html`
        <div class=${contentVariants()} data-testid="content">
          <p class="${classMap(this.titleClasses)}" data-testid="title">
            ${this.title}
          </p>
        </div>
      `;
    }

    if (this.variant === "account") {
      return html`
        <div class=${contentVariants()} data-testid="content">
          <p class="${classMap(this.titleClasses)}" data-testid="title">
            ${this.title}
          </p>
          ${this.subtitle
            ? html`<p
                class="${classMap(this.subtitleClasses)}"
                data-testid="subtitle"
              >
                ${this.subtitle}
              </p>`
            : ""}
        </div>
      `;
    }

    return "";
  }

  private renderAmount() {
    if (this.variant === "account" && this.amount) {
      return html`
        <div class=${amountVariants()} data-testid="amount">
          ${this.amount}${this.currency ? ` ${this.currency}` : ""}
        </div>
      `;
    }
    return "";
  }

  private renderChevron() {
    if (this.variant === "connection") {
      return html`
        <div data-testid="chevron">
          <ledger-icon-atom type="chevron" size="medium"></ledger-icon-atom>
        </div>
      `;
    }
    return "";
  }

  private handleClick() {
    if (this.disabled || !this.clickable) return;

    this.dispatchEvent(
      new CustomEvent("list-item-click", {
        bubbles: true,
        composed: true,
        detail: {
          variant: this.variant,
          title: this.title,
          subtitle: this.subtitle,
          amount: this.amount,
          currency: this.currency,
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

  override render() {
    const content = html`
      ${this.renderIcon()} ${this.renderContent()} ${this.renderAmount()}
      ${this.renderChevron()}
    `;

    return when(
      this.clickable,
      () => html`
        <button
          class=${classMap(this.containerClasses)}
          ?disabled=${this.disabled}
          @click=${this.handleClick}
          @keydown=${this.handleKeyDown}
          role="button"
          tabindex=${this.disabled ? "-1" : "0"}
          aria-label=${this.title}
        >
          ${content}
        </button>
      `,
      () => html`
        <div
          class=${classMap(this.containerClasses)}
          @click=${this.handleClick}
          @keydown=${this.handleKeyDown}
          tabindex="-1"
          aria-label=${this.title}
        >
          ${content}
        </div>
      `,
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-list-item-molecule": LedgerListItemMolecule;
  }
}

export default LedgerListItemMolecule;
