import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import tailwindStyles from "../../../../styles.css?inline";
import { CloseIcon, LedgerIcon } from "./index";

export interface LedgerIconAtomAttributes {
  type: "ledger" | "close";
  size: "small" | "medium" | "large";
}

@customElement("ledger-icon-atom")
export class LedgerIconAtom extends LitElement {
  @property({ type: String })
  type = "ledger";

  @property({ type: String })
  size = "medium";

  static override styles = [
    unsafeCSS(tailwindStyles),
    unsafeCSS(`
      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    `),
  ];

  private get iconClasses(): string {
    const sizeClasses: Record<string, string> = {
      small: "w-8 h-8",
      medium: "w-16 h-16",
      large: "w-32 h-32",
    };

    return sizeClasses[this.size];
  }

  override render() {
    const iconMapper = {
      ledger: () => LedgerIcon,
      close: () => CloseIcon,
    };
    const renderIcon =
      iconMapper[this.type as keyof typeof iconMapper] || iconMapper.ledger;

    return html`<div aria-hidden="true" role="img" class="${this.iconClasses}">
      ${renderIcon()}
    </div> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-icon-atom": LedgerIconAtom;
  }
}

export default LedgerIconAtom;
