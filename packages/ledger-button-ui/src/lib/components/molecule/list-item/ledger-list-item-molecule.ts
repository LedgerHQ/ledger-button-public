import "../../atom/icon/ledger-icon-atom";

import { cva } from "class-variance-authority";
import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { when } from "lit/directives/when.js";

import tailwindStyles from "../../../../styles.css?inline";

export type ListItemVariant = "connection" | "account";
export type ListItemSize = "small" | "medium" | "large";

export interface LedgerListItemMoleculeAttributes {
  variant?: ListItemVariant;
  size?: ListItemSize;
  title?: string;
  subtitle?: string;
  amount?: string;
  currency?: string;
  iconType?: string;
  iconColor?: string;
  clickable?: boolean;
  disabled?: boolean;
}

const listItemVariants = cva(
  [
    "w-full flex items-center transition-colors duration-200",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
  ],
  {
    variants: {
      variant: {
        connection: [
          "rounded-12 bg-muted p-16 hover:bg-muted-hover",
          "cursor-pointer active:bg-muted-pressed",
        ],
        account: [
          "rounded-12 bg-muted p-16 hover:bg-muted-hover",
          "cursor-pointer active:bg-muted-pressed",
        ],
      },
      size: {
        small: ["min-h-48"],
        medium: ["min-h-64"],
        large: ["min-h-72"],
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
      size: "medium",
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
        connection: ["h-40 w-40 bg-accent"],
        account: ["h-40 w-40"],
      },
    },
    defaultVariants: {
      variant: "connection",
    },
  },
);

const titleVariants = cva([
  "text-base body-1-semi-bold",
  "m-0 overflow-hidden text-ellipsis whitespace-nowrap",
]);

const subtitleVariants = cva([
  "text-muted body-2",
  "m-0 mt-2 overflow-hidden text-ellipsis whitespace-nowrap",
]);

const amountVariants = cva([
  "text-base body-1-semi-bold",
  "m-0 flex-shrink-0 text-right",
]);

const chevronVariants = cva(["ml-8 flex-shrink-0 text-muted"]);

const avatarVariants = cva([
  "flex h-40 w-40 items-center justify-center rounded-full",
  "flex-shrink-0 text-base body-1-semi-bold",
]);

const contentVariants = cva(["min-w-0 flex-1"]);

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

  @property({ type: String, attribute: "icon-color" })
  iconColor = "";

  @property({ type: Boolean })
  clickable = true;

  @property({ type: Boolean })
  disabled = false;

  static override styles = [
    unsafeCSS(tailwindStyles),
    css`
      :host {
        display: block;
        width: 100%;
      }

      :host([disabled]) {
        pointer-events: none;
      }
    `,
  ];

  private get containerClasses() {
    return {
      [listItemVariants({
        variant: this.variant,
        size: this.size,
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

  private getAvatarStyle() {
    if (this.iconColor) {
      return `background-color: ${this.iconColor};`;
    }
    return "background-color: #6366f1;"; // Default color
  }

  private getAvatarInitials() {
    if (this.title) {
      const words = this.title.split(" ");
      if (words.length >= 2) {
        return (
          words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase()
        );
      }
      return this.title.charAt(0).toUpperCase();
    }
    return "?";
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
        <div
          class=${avatarVariants()}
          style=${this.getAvatarStyle()}
          data-testid="account-avatar"
        >
          ${this.getAvatarInitials()}
        </div>
      `;
    }

    return "";
  }

  private renderContent() {
    if (this.variant === "connection") {
      return html`
        <div class=${contentVariants()} data-testid="content">
          <p class=${titleVariants()} data-testid="title">${this.title}</p>
        </div>
      `;
    }

    if (this.variant === "account") {
      return html`
        <div class=${contentVariants()} data-testid="content">
          <p class=${titleVariants()} data-testid="title">${this.title}</p>
          ${this.subtitle
            ? html`<p class=${subtitleVariants()} data-testid="subtitle">
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
        <div class=${chevronVariants()} data-testid="chevron">
          <ledger-icon-atom type="chevron" size="small"></ledger-icon-atom>
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
