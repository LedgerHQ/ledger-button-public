import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import tailwindStyles from "../../../../styles.css?inline";
import {
  BluetoothIcon,
  BscIcon,
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  DeviceIcon,
  ErrorIcon,
  EthereumIcon,
  LedgerLogoIcon,
  PolygonIcon,
  UsbIcon,
} from "./index";

export interface LedgerIconAttributes {
  type:
    | "ledger"
    | "close"
    | "bluetooth"
    | "usb"
    | "chevron"
    | "ethereum"
    | "bsc"
    | "polygon"
    | "check"
    | "error"
    | "device";
  size: "small" | "medium" | "large";
}

@customElement("ledger-icon")
export class LedgerIcon extends LitElement {
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
      small: "w-16 h-16",
      medium: "w-24 h-24",
      large: "w-32 h-32",
    };

    return sizeClasses[this.size];
  }

  override render() {
    const iconMapper = {
      ledger: () => LedgerLogoIcon,
      close: () => CloseIcon,
      bluetooth: () => BluetoothIcon,
      usb: () => UsbIcon,
      chevron: () => ChevronIcon,
      ethereum: () => EthereumIcon,
      bsc: () => BscIcon,
      polygon: () => PolygonIcon,
      check: () => CheckIcon,
      error: () => ErrorIcon,
      device: () => DeviceIcon,
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
    "ledger-icon": LedgerIcon;
  }
}

export default LedgerIcon;
