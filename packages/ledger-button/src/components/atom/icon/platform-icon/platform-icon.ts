import { cva } from "class-variance-authority";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { tailwindElement } from "../../../../tailwind-element.js";
import desktop from "./desktop.js";
import mobile from "./mobile.js";

export type PlatformType = "mobile" | "desktop";

const iconContainerVariants = cva([
  "flex h-24 w-24 items-center justify-center rounded-full",
  "bg-muted-transparent",
]);

@customElement("platform-icon")
@tailwindElement()
export class PlatformIcon extends LitElement {
  @property({ type: String })
  platformType: PlatformType = "mobile";

  private get iconContainerClass() {
    return {
      [iconContainerVariants()]: true,
    };
  }

  private getIcon() {
    switch (this.platformType) {
      case "desktop":
        return desktop;
      case "mobile":
        return mobile;
      default:
        return mobile;
    }
  }

  override render() {
    return html`
      <div class=${classMap(this.iconContainerClass)}>${this.getIcon()}</div>
    `;
  }
}
