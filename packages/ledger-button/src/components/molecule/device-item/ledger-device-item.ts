import "../../atom/icon/ledger-icon";
import "../../atom/icon/device-icon/device-icon";

import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../tailwind-element.js";
import { type DeviceModelId } from "../../atom/icon/device-icon/device-icon";

const deviceItemVariants = cva(
  [
    "group group flex items-center justify-between rounded-md",
    "min-w-full",
    "bg-muted p-12 transition duration-150 ease-in-out hover:bg-muted-hover",
  ],
  {
    variants: {
      clickable: {
        true: ["cursor-pointer"],
        false: ["cursor-default"],
      },
      disabled: {
        true: ["pointer-events-none cursor-not-allowed opacity-50"],
        false: [],
      },
    },
    defaultVariants: {
      clickable: true,
      disabled: false,
    },
  },
);

const statusIndicatorVariants = cva(
  ["rounded-xs px-8 py-4 body-4"],
  {
    variants: {
      status: {
        connected: ["text-success-foreground bg-success"],
        available: ["bg-muted text-muted"],
      },
    },
    defaultVariants: {
      status: "available",
    },
  },
);

export type DeviceStatus = "connected" | "available";

export type DeviceItemClickEventDetail = {
  deviceId: string;
  title: string;
  connectionType: "bluetooth" | "usb" | "";
  status: DeviceStatus;
  timestamp: number;
};

export interface LedgerDeviceItemAttributes {
  deviceId?: string;
  title?: string;
  connectionType?: "bluetooth" | "usb";
  deviceModelId?: DeviceModelId;
  status?: DeviceStatus;
  clickable?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  connectedText?: string;
  availableText?: string;
}

@customElement("ledger-device-item")
@tailwindElement()
export class LedgerDeviceItem extends LitElement {
  @property({ type: String, attribute: "device-id" })
  deviceId = "";

  @property({ type: String })
  override title = "";

  @property({ type: String, attribute: "connection-type" })
  connectionType: "bluetooth" | "usb" | "" = "";

  @property({ type: String, attribute: "device-model-id" })
  deviceModelId: DeviceModelId = "flex";

  @property({ type: String })
  status: DeviceStatus = "available";

  @property({ type: Boolean })
  clickable = true;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: String, attribute: "connected-text" })
  connectedText = "Connected";

  @property({ type: String, attribute: "available-text" })
  availableText = "Available";

  private get containerClasses() {
    return {
      [deviceItemVariants({
        clickable: this.clickable,
        disabled: this.disabled,
      })]: true,
    };
  }

  private get statusClasses() {
    return {
      [statusIndicatorVariants({ status: this.status })]: true,
    };
  }

  private handleClick() {
    if (this.disabled || !this.clickable) return;

    this.dispatchEvent(
      new CustomEvent<DeviceItemClickEventDetail>("device-item-click", {
        bubbles: true,
        composed: true,
        detail: {
          deviceId: this.deviceId,
          title: this.title,
          connectionType: this.connectionType,
          status: this.status,
          timestamp: Date.now(),
        },
      }),
    );
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (this.disabled || !this.clickable) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleClick();
    }
  }

  private renderDeviceIcon() {
    return html`
      <div class="relative">
        <div
          class="rounded-full bg-muted-transparent p-8 drop-shadow-md"
        >
          <device-icon .modelId=${this.deviceModelId}></device-icon>
        </div>
        ${this.renderConnectionBadge()}
      </div>
    `;
  }

  private renderConnectionBadge() {
    if (!this.connectionType) return "";

    return html`
      <div
        class="absolute -lb-bottom-2 -lb-right-2 flex h-20 w-20 items-center justify-center rounded-full bg-base shadow-sm"
      >
        <ledger-icon
          type=${this.connectionType}
          size="small"
          fillColor="var(--color-foreground)"
        ></ledger-icon>
      </div>
    `;
  }

  private renderTitle() {
    return html`
      ${this.title
        ? html`<span class="py-8 text-base body-2"
            >${this.title}</span
          >`
        : ""}
    `;
  }

  private renderStatus() {
    const statusText =
      this.status === "connected" ? this.connectedText : this.availableText;

    return html`
      <div class=${classMap(this.statusClasses)}>${statusText}</div>
    `;
  }

  override render() {
    return html`
      <button
        class=${classMap(this.containerClasses)}
        ?disabled=${this.disabled}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
        role="button"
        tabindex=${this.disabled ? "-1" : "0"}
        aria-label=${this.title || ""}
      >
        <div class="flex items-center gap-12">
          ${this.renderDeviceIcon()}
          <div class="flex flex-col items-start gap-4">
            ${this.renderTitle()}
          </div>
        </div>
        <div class="flex items-center gap-12">
          ${this.renderStatus()}
        </div>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-device-item": LedgerDeviceItem;
  }
}

export default LedgerDeviceItem;
