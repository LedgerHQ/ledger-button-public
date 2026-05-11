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

const SIZE_CLASSES: Record<LedgerIconSize, string> = {
  12: "w-12 h-12",
  16: "w-16 h-16",
  20: "w-20 h-20",
  24: "w-24 h-24",
  32: "w-32 h-32",
  40: "w-40 h-40",
  48: "w-48 h-48",
  56: "w-56 h-56",
};

const LEGAL_SIZES = new Set<number>([12, 16, 20, 24, 32, 40, 48, 56]);

function normalizeIconSize(size: number): LedgerIconSize {
  if (!Number.isFinite(size) || !LEGAL_SIZES.has(size)) {
    return 24;
  }
  return size as LedgerIconSize;
}

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

  private get iconClasses(): string {
    return SIZE_CLASSES[normalizeIconSize(this.size)];
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
