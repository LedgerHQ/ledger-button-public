import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";
import {
  BluetoothIcon,
  CartIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  DeviceIcon,
  ErrorIcon,
  LedgerLogoIcon,
  UsbIcon,
} from "./index";

export interface LedgerIconAttributes {
  type:
    | "ledger"
    | "close"
    | "bluetooth"
    | "usb"
    | "chevronRight"
    | "chevronDown"
    | "check"
    | "error"
    | "device"
    | "cart";
  size: "small" | "medium" | "large" | "icon";
}

const styles = css`
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
`;

@customElement("ledger-icon")
@tailwindElement(styles)
export class LedgerIcon extends LitElement {
  @property({ type: String })
  type: LedgerIconAttributes["type"] = "ledger";

  @property({ type: String })
  size = "medium";

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
      chevronRight: () => ChevronRightIcon,
      chevronDown: () => ChevronDownIcon,
      check: () => CheckIcon,
      error: () => ErrorIcon,
      device: () => DeviceIcon,
      cart: () => CartIcon,
    };
    const renderIcon =
      iconMapper[this.type as keyof typeof iconMapper] || iconMapper.ledger;

    return html`<div
      aria-hidden="true"
      role="img"
      class="${this.iconClasses} flex items-center justify-center"
    >
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
