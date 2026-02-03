import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";

import { tailwindElement } from "../../../tailwind-element.js";

export type SkeletonVariant = "text" | "block";

export interface LedgerSkeletonAttributes {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
}

const styles = css`
  .shimmer::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.08) 20%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.08) 80%,
      transparent 100%
    );
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
`;

@customElement("ledger-skeleton")
@tailwindElement(styles)
export class LedgerSkeleton extends LitElement {
  @property({ type: String })
  variant: SkeletonVariant = "text";

  @property({ type: String })
  width?: string;

  @property({ type: String })
  height?: string;

  private get skeletonClasses() {
    return {
      "lb-relative lb-overflow-hidden lb-bg-muted shimmer": true,
      "lb-h-[1em] lb-rounded-4": this.variant === "text",
      "lb-rounded-8": this.variant === "block",
    };
  }

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
        class=${classMap(this.skeletonClasses)}
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
