import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";
import {
  BackIcon,
  BluetoothIcon,
  BuyIcon,
  CartIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClearSigningIcon,
  CloseIcon,
  DesktopIcon,
  DeviceIcon,
  DirectConnectivityIcon,
  EarnIcon,
  EnvelopeIcon,
  ErrorIcon,
  ExternalLinkIcon,
  HeadphoneIcon,
  InfoIcon,
  LedgerLogoIcon,
  MobileIcon,
  QuestionIcon,
  ReceiveIcon,
  SearchIcon,
  SellIcon,
  SendIcon,
  SettingsIcon,
  ShieldIcon,
  SwapIcon,
  TransactionCheckIcon,
  UsbIcon,
} from "./index";

export interface LedgerIconAttributes {
  type:
    | "ledger"
    | "back"
    | "close"
    | "bluetooth"
    | "usb"
    | "chevronRight"
    | "chevronDown"
    | "check"
    | "error"
    | "device"
    | "mobile"
    | "desktop"
    | "cart"
    | "externalLink"
    | "directConnectivity"
    | "clearSigning"
    | "transactionCheck"
    | "question"
    | "settings"
    | "send"
    | "receive"
    | "swap"
    | "buy"
    | "earn"
    | "sell"
    | "search"
    | "info"
    | "headphone"
    | "envelope"
    | "shield";
  size: "small" | "medium" | "large";
  fillColor?: string;
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

  @property({ type: String })
  fillColor?: string;

  private get iconClasses(): string {
    const sizeClasses: { [key: string]: string } = {
      small: "w-16 h-16",
      20: "w-20 h-20",
      medium: "w-24 h-24",
      large: "w-32 h-32",
    };

    return sizeClasses[this.size];
  }

  override render() {
    const iconMapper = {
      ledger: () => LedgerLogoIcon,
      back: () => BackIcon,
      close: () => CloseIcon,
      bluetooth: () => BluetoothIcon,
      usb: () => UsbIcon,
      chevronRight: () => ChevronRightIcon,
      chevronDown: () => ChevronDownIcon,
      check: () => CheckIcon,
      error: () => ErrorIcon,
      device: () => DeviceIcon,
      mobile: () => MobileIcon,
      desktop: () => DesktopIcon,
      cart: () => CartIcon,
      externalLink: () => ExternalLinkIcon,
      directConnectivity: () => DirectConnectivityIcon,
      clearSigning: () => ClearSigningIcon,
      transactionCheck: () => TransactionCheckIcon,
      question: () => QuestionIcon,
      settings: () => SettingsIcon,
      send: () => SendIcon,
      receive: () => ReceiveIcon,
      swap: () => SwapIcon,
      buy: () => BuyIcon,
      earn: () => EarnIcon,
      sell: () => SellIcon,
      search: () => SearchIcon,
      info: () => InfoIcon,
      headphone: () => HeadphoneIcon,
      envelope: () => EnvelopeIcon,
      shield: () => ShieldIcon,
    };
    const renderIcon =
      iconMapper[this.type as keyof typeof iconMapper] || iconMapper.ledger;

    return html`<div
      aria-hidden="true"
      role="img"
      style="fill: ${this.fillColor ?? "black"}; color: ${this.fillColor ??
      "black"};"
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
