import "../../atom/icon/ledger-icon-atom";

import { cva } from "class-variance-authority";
import { html, LitElement, nothing, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import tailwindStyles from "../../../../styles.css?inline";
import FlexDeviceIcon from "./flex-device-icon";
import NanoxDeviceIcon from "./nanox-device-icon";
import StaxDeviceIcon from "./stax-device-icon";

export type DeviceType = "flex" | "nanox" | "stax";

const infoStateVariants = cva(
  "flex flex-col items-center justify-center text-center text-white",
  {
    variants: {
      device: {
        flex: "p-24",
        nanox: "p-20",
        stax: "p-28",
      },
    },
    defaultVariants: {
      device: "flex",
    },
  },
);

const deviceIconVariants = cva("mb-32", {
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

export interface LedgerInfoStateMoleculeAttributes {
  device: DeviceType;
  title: string;
  subtitle?: string;
}

@customElement("ledger-info-state-molecule")
export class LedgerInfoStateMolecule extends LitElement {
  @property({ type: String })
  device: DeviceType = "flex";

  @property({ type: String })
  override title = "";

  @property({ type: String })
  subtitle = "";

  static override styles = [unsafeCSS(tailwindStyles)];

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
        <div
          class="${deviceIconVariants({ device: this.device })}"
          data-testid="device-icon"
        >
          ${this.renderDeviceIcon()}
        </div>

        <h2
          class="font-semibold leading-tight mb-16 font-inter text-white heading-4"
          data-testid="title"
        >
          ${this.title}
        </h2>

        ${this.subtitle
          ? html`
              <p
                class="font-normal leading-relaxed max-w-300 font-inter text-white opacity-60 body-1"
                data-testid="subtitle"
              >
                ${this.subtitle}
              </p>
            `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-info-state-molecule": LedgerInfoStateMolecule;
  }
}

export default LedgerInfoStateMolecule;
