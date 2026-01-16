import "../icon/ledger-icon.js";

import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { animate } from "motion";

import { ANIMATION_DELAY } from "../../../shared/navigation.js";
import { tailwindElement } from "../../../tailwind-element.js";
import type { AnimationInstance } from "../modal/animation-types.js";

export type DrawerCloseEventDetail = {
  timestamp: number;
};

export interface LedgerDrawerAttributes {
  showCloseButton: boolean;
}

/**
 * A reusable drawer component that slides up from the bottom of its container.
 *
 * @fires drawer-close - Fired when the drawer is closed (via backdrop click or close button)
 *
 * @slot - Default slot for the drawer content
 *
 * @example
 * ```html
 * <ledger-drawer @drawer-close=${this.handleClose}>
 *   <div>Your content here</div>
 * </ledger-drawer>
 * ```
 */
@customElement("ledger-drawer")
@tailwindElement()
export class LedgerDrawer extends LitElement {
  /**
   * Whether to show the close button in the top-right corner.
   * @default true
   */
  @property({ type: Boolean })
  showCloseButton = true;

  @query(".drawer-backdrop")
  private backdropElement!: HTMLElement;

  @query(".drawer-container")
  private containerElement!: HTMLElement;

  private backdropAnimation: AnimationInstance | null = null;
  private containerAnimation: AnimationInstance | null = null;
  private isClosing = false;

  override firstUpdated() {
    this.animateOpen();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cancelAnimations();
  }

  /**
   * Programmatically close the drawer with animation.
   * Dispatches 'drawer-close' event after animation completes.
   */
  public async close(): Promise<void> {
    await this.handleClose();
  }

  private animateOpen() {
    this.cancelAnimations();

    this.backdropAnimation = animate(
      this.backdropElement,
      { opacity: [0, 1] },
      { duration: ANIMATION_DELAY / 1000, ease: "easeOut" },
    );

    this.containerAnimation = animate(
      this.containerElement,
      { transform: ["translateY(100%)", "translateY(0)"] },
      { duration: ANIMATION_DELAY / 1000, ease: "easeOut" },
    );
  }

  private async animateClose(): Promise<void> {
    this.cancelAnimations();

    const animations: Promise<void>[] = [];

    animations.push(
      new Promise<void>((resolve) => {
        this.backdropAnimation = animate(
          this.backdropElement,
          { opacity: [1, 0] },
          {
            duration: ANIMATION_DELAY / 1000,
            ease: "easeOut",
            onComplete: () => resolve(),
          },
        );
      }),
    );

    animations.push(
      new Promise<void>((resolve) => {
        this.containerAnimation = animate(
          this.containerElement,
          { transform: ["translateY(0)", "translateY(100%)"] },
          {
            duration: ANIMATION_DELAY / 1000,
            ease: "easeOut",
            onComplete: () => resolve(),
          },
        );
      }),
    );

    await Promise.all(animations);
  }

  private cancelAnimations() {
    if (this.backdropAnimation) {
      this.backdropAnimation.cancel();
      this.backdropAnimation = null;
    }
    if (this.containerAnimation) {
      this.containerAnimation.cancel();
      this.containerAnimation = null;
    }
  }

  private async handleClose() {
    if (this.isClosing) return;

    this.isClosing = true;
    await this.animateClose();

    this.dispatchEvent(
      new CustomEvent<DrawerCloseEventDetail>("drawer-close", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
        },
      }),
    );
  }

  private renderCloseButton() {
    if (!this.showCloseButton) return null;

    return html`
      <button
        class="lb-absolute lb-right-16 lb-top-16 lb-flex lb-cursor-pointer lb-items-center lb-justify-center lb-border-none lb-bg-transparent lb-p-8"
        @click=${this.handleClose}
        aria-label="Close"
      >
        <ledger-icon type="close" size="small" fillColor="white"></ledger-icon>
      </button>
    `;
  }

  override render() {
    return html`
      <div
        class="lb-absolute lb-inset-0 lb-z-50"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="drawer-backdrop lb-absolute lb-inset-0 lb-bg-canvas-overlay lb-opacity-60"
          @click=${this.handleClose}
        ></div>
        <div
          class="drawer-container lb-absolute lb-bottom-0 lb-left-0 lb-right-0 lb-rounded-t-3xl lb-bg-canvas-sheet"
          style="transform: translateY(100%)"
        >
          ${this.renderCloseButton()}
          <div class="lb-p-24 lb-pt-32">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-drawer": LedgerDrawer;
  }

  interface WindowEventMap {
    "drawer-close": CustomEvent<DrawerCloseEventDetail>;
  }
}

export default LedgerDrawer;
