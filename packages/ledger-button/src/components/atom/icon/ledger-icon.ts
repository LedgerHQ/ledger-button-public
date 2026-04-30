import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element.js";
import {
  BackIcon,
  BluetoothIcon,
  BuyIcon,
  CartIcon,
  CheckIcon,
  CheckMarkCircleFillIcon,
  CheckmarkCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClearSigningIcon,
  ClockIcon,
  CloseIcon,
  CoinsIcon,
  DeleteCircleFillIcon,
  DesktopIcon,
  DeviceIcon,
  DirectConnectivityIcon,
  DollarIcon,
  EarnIcon,
  EnvelopeIcon,
  ErrorIcon,
  ExternalLinkIcon,
  HeadphoneIcon,
  InfoIcon,
  LanguageIcon,
  LedgerLogoIcon,
  MobileIcon,
  PlusIcon,
  QuestionIcon,
  ReceiveIcon,
  RefreshIcon,
  SearchIcon,
  SellIcon,
  SendIcon,
  SettingsAlt2Icon,
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
    | "checkMarkCircleFill"
    | "checkmarkCircle"
    | "clock"
    | "deleteCircleFill"
    | "error"
    | "device"
    | "mobile"
    | "desktop"
    | "dollar"
    | "cart"
    | "externalLink"
    | "directConnectivity"
    | "clearSigning"
    | "coins"
    | "transactionCheck"
    | "question"
    | "settings"
    | "settingsAlt2"
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
    | "shield"
    | "language"
    | "plus"
    | "refresh";
  size: "small" | "20" | "medium" | "large" | "40";
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
      40: "w-40 h-40",
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
      checkMarkCircleFill: () => CheckMarkCircleFillIcon,
      checkmarkCircle: () => CheckmarkCircleIcon,
      clock: () => ClockIcon,
      deleteCircleFill: () => DeleteCircleFillIcon,
      error: () => ErrorIcon,
      device: () => DeviceIcon,
      mobile: () => MobileIcon,
      desktop: () => DesktopIcon,
      dollar: () => DollarIcon,
      cart: () => CartIcon,
      externalLink: () => ExternalLinkIcon,
      directConnectivity: () => DirectConnectivityIcon,
      clearSigning: () => ClearSigningIcon,
      coins: () => CoinsIcon,
      transactionCheck: () => TransactionCheckIcon,
      question: () => QuestionIcon,
      settings: () => SettingsIcon,
      settingsAlt2: () => SettingsAlt2Icon,
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
      language: () => LanguageIcon,
      plus: () => PlusIcon,
      refresh: () => RefreshIcon,
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
