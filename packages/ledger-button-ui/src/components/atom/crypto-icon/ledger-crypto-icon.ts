import { cva } from "class-variance-authority";
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import tailwindStyles from "../../../styles.css?inline";
import cryptoIconMap from "./map.json";

export type CryptoIconSize = "small" | "medium" | "large";
export type CryptoIconVariant = "rounded" | "square";

export interface LedgerCryptoIconAttributes {
  ledgerId: string;
  size?: CryptoIconSize;
  variant?: CryptoIconVariant;
}

const cryptoIconVariants = cva(
  ["flex items-center justify-center overflow-hidden"],
  {
    variants: {
      size: {
        small: ["h-20 w-20"],
        medium: ["h-24 w-24"],
        large: ["h-32 w-32"],
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

const CRYPTO_ICONS_BASE_URL = "https://crypto-icons.ledger.com/";

@customElement("ledger-crypto-icon")
export class LedgerCryptoIcon extends LitElement {
  @property({ type: String, attribute: "ledger-id" })
  ledgerId = "";

  @property({ type: String })
  size: CryptoIconSize = "large";

  @property({ type: String })
  variant: CryptoIconVariant = "rounded";

  static override styles = [unsafeCSS(tailwindStyles)];

  private get iconClasses() {
    return cryptoIconVariants({ size: this.size, variant: this.variant });
  }

  private getCryptoIconUrl(ledgerId: string): string | null {
    if (ledgerId in cryptoIconMap) {
      const cryptoData = cryptoIconMap[ledgerId as keyof typeof cryptoIconMap];
      if (cryptoData && cryptoData.icon) {
        return `${CRYPTO_ICONS_BASE_URL}${cryptoData.icon}`;
      }
    }

    return null;
  }

  private renderFallback() {
    return html` <div class="${this.iconClasses} bg-active"></div> `;
  }

  private renderCryptoIcon(iconUrl: string) {
    return html`
      <div class="${this.iconClasses}">
        <img
          class="h-full w-full block object-cover"
          src=${iconUrl}
          alt=${this.ledgerId || "Crypto icon"}
        />
      </div>
    `;
  }

  override render() {
    if (!this.ledgerId) {
      return this.renderFallback();
    }

    const iconUrl = this.getCryptoIconUrl(this.ledgerId);

    if (iconUrl) {
      return this.renderCryptoIcon(iconUrl);
    }

    // Fallback: render blank circle
    return this.renderFallback();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-crypto-icon": LedgerCryptoIcon;
  }
}

export default LedgerCryptoIcon;
