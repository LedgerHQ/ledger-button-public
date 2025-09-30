import { DeviceModelId as CoreDeviceModelId } from "@ledgerhq/ledger-button-core";
import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../../tailwind-element.js";
import flex from "./flex";
import nano from "./nano";
import stax from "./stax";

export type DeviceModelId = "stax" | "flex" | "nanos" | "nanosp" | "nanox";

const iconContainerVariants = cva([
  "flex h-24 w-24 items-center justify-center rounded-full",
  "bg-muted-transparent",
]);

@customElement("device-icon")
@tailwindElement()
export class DeviceIcon extends LitElement {
  @property({ type: String })
  modelId: CoreDeviceModelId = CoreDeviceModelId.STAX;

  private get iconContainerClass() {
    return {
      [iconContainerVariants()]: true,
    };
  }

  private getIcon() {
    switch (this.modelId) {
      case CoreDeviceModelId.STAX:
        return stax;
      case CoreDeviceModelId.FLEX:
        return flex;
      case CoreDeviceModelId.NANO_S:
      case CoreDeviceModelId.NANO_SP:
      case CoreDeviceModelId.NANO_X:
        return nano;
      default:
        return flex;
    }
  }

  override render() {
    return html`
      <div class=${classMap(this.iconContainerClass)}>${this.getIcon()}</div>
    `;
  }
}
