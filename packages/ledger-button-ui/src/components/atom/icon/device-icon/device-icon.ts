import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../../tailwind-element";
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
  modelId: DeviceModelId = "stax";

  private get iconContainerClass() {
    return {
      [iconContainerVariants()]: true,
    };
  }

  private getIcon() {
    switch (this.modelId) {
      case "stax":
        return stax;
      case "flex":
        return flex;
      case "nanos":
      case "nanosp":
      case "nanox":
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
