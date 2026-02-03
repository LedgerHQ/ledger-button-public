import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

export interface LedgerSkeletonAttributes {
  width?: string;
  height?: string;
}

@customElement("ledger-skeleton")
@tailwindElement()
export class LedgerSkeleton extends LitElement {
  @property({ type: String })
  width?: string;

  @property({ type: String })
  height?: string;

  private get skeletonStyles() {
    const styles: Record<string, string> = {};

    if (this.width) {
      styles.width = this.width;
    }

    if (this.height) {
      styles.height = this.height;
    }

    return styles;
  }

  override render() {
    return html`
      <div
        data-slot="skeleton"
        class="lb-animate-pulse lb-rounded-md lb-bg-muted"
        style=${styleMap(this.skeletonStyles)}
        role="presentation"
        aria-hidden="true"
      ></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-skeleton": LedgerSkeleton;
  }
}

export default LedgerSkeleton;
