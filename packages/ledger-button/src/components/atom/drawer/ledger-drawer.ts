import "../icon/ledger-icon";

import { css, html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { animate } from "motion";

import { ANIMATION_DELAY } from "../../../shared/navigation";
import { tailwindElement } from "../../../tailwind-element";
import { type AnimationInstance } from "../modal/animation-types";
import { SlideUpAnimation } from "../modal/slide-up-animation";

const styles = css`
  .drawer-halo {
    background: var(
      --status-gradient-sheet-muted,
      radial-gradient(
        43.56% 33.06% at 50.47% 0.14%,
        var(--background-muted-strong) 0%,
        var(--background-muted-transparent) 100%
      )
    );
  }
`;

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
@tailwindElement(styles)
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
  private readonly slideUpAnimation = new SlideUpAnimation();
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

    this.slideUpAnimation.open(this.containerElement);
  }

  private async animateClose(): Promise<void> {
    this.cancelAnimations();

    const backdropAnimation = new Promise<void>((resolve) => {
      this.backdropAnimation = animate(
        this.backdropElement,
        { opacity: [1, 0] },
        {
          duration: ANIMATION_DELAY / 1000,
          ease: "easeOut",
          onComplete: () => resolve(),
        },
      );
    });

    await Promise.all([
      backdropAnimation,
      this.slideUpAnimation.close(this.containerElement),
    ]);
  }

  private cancelAnimations() {
    if (this.backdropAnimation) {
      this.backdropAnimation.cancel();
      this.backdropAnimation = null;
    }
    this.slideUpAnimation.cancel();
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
        class="absolute right-16 top-16 flex cursor-pointer items-center justify-center rounded-full border-none bg-muted p-8 hover:bg-muted-hover active:bg-muted-pressed"
        @click=${this.handleClose}
        aria-label="Close"
      >
        <ledger-icon type="close" .size=${16} fillColor="white"></ledger-icon>
      </button>
    `;
  }

  override render() {
    return html`
      <div
        class="z-50 absolute inset-0"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="drawer-backdrop absolute inset-0 bg-canvas-overlay opacity-60"
          @click=${this.handleClose}
        ></div>
        <div
          class="drawer-container absolute bottom-0 left-0 right-0 rounded-t-xl bg-canvas-sheet"
          style="transform: translateY(100%)"
        >
          <div class="drawer-halo rounded-t-xl pt-64">
            ${this.renderCloseButton()}
            <div class="p-24 pt-32">
              <slot></slot>
            </div>
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
