import "../../atom/icon/ledger-icon";

import { cva } from "class-variance-authority";
import { html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

import { tailwindElement } from "../../../tailwind-element";
import FlexDeviceIcon from "./flex-device-icon";
import NanoxDeviceIcon from "./nanox-device-icon";
import StaxDeviceIcon from "./stax-device-icon";

export type DeviceType = "nanox" | "stax" | "flex";

const infoStateVariants = cva(
  "flex flex-col items-center justify-center text-center text-base",
  {
    variants: {
      device: {
        flex: "p-24 pt-0",
        nanox: "p-20 pt-0",
        stax: "p-28 pt-0",
      },
    },
    defaultVariants: {
      device: "flex",
    },
  },
);

const deviceIconVariants = cva("", {
  variants: {
    device: {
      flex: "",
      nanox: "opacity-80",
      stax: "opacity-90",
    },
  },
  defaultVariants: {
    device: "flex",
  },
});

export interface LedgerInfoStateAttributes {
  device: DeviceType;
  title: string;
  subtitle?: string;
}

@customElement("ledger-info-state")
@tailwindElement()
export class LedgerInfoState extends LitElement {
  @property({ type: String })
  device: DeviceType = "flex";

  @property({ type: String })
  override title = "";

  @property({ type: String })
  subtitle = "";

  private renderDeviceIcon() {
    const deviceMapper = {
      flex: FlexDeviceIcon,
      nanox: NanoxDeviceIcon,
      stax: StaxDeviceIcon,
    };

    return deviceMapper[this.device];
  }

  override render() {
    return html`
      <div class="${infoStateVariants({ device: this.device })}">
        <div class="flex flex-col items-center justify-center gap-32">
          <div
            class="${deviceIconVariants({ device: this.device })}"
            data-testid="device-icon"
          >
            ${this.renderDeviceIcon()}
          </div>
          <div class="flex flex-col items-center justify-center gap-16">
            <h4
              class="font-semibold leading-tight font-inter text-base heading-4"
              data-testid="title"
            >
              ${this.title}
            </h4>

            ${this.subtitle
              ? html`
                  <p
                    class="font-normal leading-relaxed max-w-300 font-inter text-base opacity-60 body-1"
                    data-testid="subtitle"
                  >
                    ${this.subtitle}
                  </p>
                `
              : nothing}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-info-state": LedgerInfoState;
  }
}

export default LedgerInfoState;
