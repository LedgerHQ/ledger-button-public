import { cva } from "class-variance-authority";
import { html, LitElement, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element";
import { resolveIconUrl } from "./crypto-icon-mapping";

export type CryptoIconSize = "small" | "medium" | "large";
export type CryptoIconVariant = "rounded" | "square";

export interface LedgerCryptoIconAttributes {
  ledgerId: string;
  ticker: string;
  size?: CryptoIconSize;
  variant?: CryptoIconVariant;
}

const cryptoIconVariants = cva(
  ["relative flex items-center justify-center overflow-hidden"],
  {
    variants: {
      size: {
        small: ["h-20 w-20"],
        medium: ["h-32 w-32"],
        large: ["h-48 w-48"],
      },
      variant: {
        rounded: ["rounded-full"],
        square: [],
      },
    },
    compoundVariants: [
      {
        variant: "square",
        size: "small",
        class: ["rounded-xs"],
      },
      {
        variant: "square",
        size: "medium",
        class: ["rounded-sm"],
      },
      {
        variant: "square",
        size: "large",
        class: ["rounded-md"],
      },
    ],
    defaultVariants: {
      size: "large",
      variant: "rounded",
    },
  },
);

@customElement("ledger-crypto-icon")
@tailwindElement()
export class LedgerCryptoIcon extends LitElement {
  @property({ type: String, attribute: "ledger-id" })
  ledgerId = "";

  @property({ type: String, attribute: "ticker" })
  ticker = "";

  @property({ type: String, attribute: "alt" })
  alt = "";

  @property({ type: String })
  size: CryptoIconSize = "large";

  @property({ type: String })
  variant: CryptoIconVariant = "rounded";

  @state()
  private iconUrl?: string | null;

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has("ledgerId")) {
      this.iconUrl = undefined;
      void resolveIconUrl(this.ledgerId).then((url) => {
        this.iconUrl = url;
      });
    }
  }

  private get iconClasses() {
    return cryptoIconVariants({ size: this.size, variant: this.variant });
  }

  private renderFallback() {
    return html`
      <div class="${this.iconClasses} bg-grey-500">${this.alt}</div>
    `;
  }

  private renderCryptoIcon(iconUrl: string) {
    return html`
      <div class="${this.iconClasses}">
        <img
          class="token-icon bg-active block h-full w-full object-cover"
          src=${iconUrl}
          alt=${this.alt}
        />
      </div>
    `;
  }

  override render() {
    if (!this.ledgerId || this.iconUrl === undefined) {
      return this.renderFallback();
    }

    if (this.iconUrl) {
      return this.renderCryptoIcon(this.iconUrl);
    }

    return this.renderFallback();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-crypto-icon": LedgerCryptoIcon;
  }
}

export default LedgerCryptoIcon;
