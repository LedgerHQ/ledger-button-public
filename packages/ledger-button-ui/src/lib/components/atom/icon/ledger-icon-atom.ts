import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import tailwindStyles from "../../../../styles.css?inline";
import {
  BluetoothIcon,
  BscIcon,
  ChevronIcon,
  CloseIcon,
  EthereumIcon,
  LedgerIcon,
  PolygonIcon,
  UsbIcon,
} from "./index";

export interface LedgerIconAtomAttributes {
  type:
    | "ledger"
    | "close"
    | "bluetooth"
    | "usb"
    | "chevron"
    | "ethereum"
    | "bsc"
    | "polygon";
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
    const sizeClasses: { [key: string]: string } = {
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
      bluetooth: () => BluetoothIcon,
      usb: () => UsbIcon,
      chevron: () => ChevronIcon,
      ethereum: () => EthereumIcon,
      bsc: () => BscIcon,
      polygon: () => PolygonIcon,
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
