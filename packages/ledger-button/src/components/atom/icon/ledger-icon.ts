import { cva } from "class-variance-authority";
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

export type LedgerIconSize = 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56;

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
    | "plus"
    | "refresh"
    | "language";
  size?: LedgerIconSize;
  fillColor?: string;
}

const iconVariants = cva("inline-flex shrink-0 items-center justify-center", {
  variants: {
    size: {
      12: "icon-stroke-12 h-12 w-12",
      16: "icon-stroke-16 h-16 w-16",
      20: "icon-stroke-20 h-20 w-20",
      24: "icon-stroke-24 h-24 w-24",
      32: "icon-stroke-32 h-32 w-32",
      40: "icon-stroke-40 h-40 w-40",
      48: "icon-stroke-48 h-48 w-48",
      56: "icon-stroke-56 h-56 w-56",
    },
  },
  defaultVariants: { size: 24 },
});

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

  @property({ type: Number })
  size: LedgerIconSize = 24;

  @property({ type: String })
  fillColor?: string;

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
      class=${iconVariants({ size: this.size })}
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
