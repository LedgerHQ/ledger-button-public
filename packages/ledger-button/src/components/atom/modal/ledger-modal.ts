import { consume } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import {
  langContext,
  LanguageContext,
} from "../../../context/language-context.js";
import { tailwindElement } from "../../../tailwind-element.js";
import type { FloatingButtonPosition } from "../floating-button/ledger-floating-button.js";
import {
  ModalAnimationController,
  type ModalMode,
} from "./modal-animation-controller.js";
import { ModalFocusController } from "./modal-focus-controller.js";
import { ModalScrollLockController } from "./modal-scroll-lock-controller.js";

export type { ModalMode };

const styles = css`
  .modal-wrapper {
    display: none;
  }

  .modal-wrapper--open {
    display: block;
  }

  .modal-backdrop {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    z-index: 7730;
    background: radial-gradient(
      50% 50% at 50% 50%,
      rgba(102, 102, 102, 0.6) 0%,
      rgba(0, 0, 0, 0.6) 100%
    );
    backdrop-filter: blur(calc(var(--blur-md, 12px) / 2));
  }

  .modal-container {
    z-index: 7731;
    overflow: hidden;
  }

  .modal-container--center {
    width: min(calc(100% - 32px), 400px);
    height: auto;
    max-height: min(calc(100vh - 64px), var(--modal-max-height, 550px));
    opacity: 0;
    transition: max-height 0.3s ease;
  }

  .modal-container--panel {
    width: 400px;
    height: calc(100vh - 32px);
    max-height: 100vh;
    transform: translateX(100%);
  }
`;

const centerContainerClasses = {
  "modal-container": true,
  "modal-container--center": true,
  fixed: true,
  "inset-0": true,
  flex: true,
  "flex-col": true,
  "self-center": true,
  "justify-self-center": true,
  "overflow-hidden": true,
  "bg-canvas-sheet": true,
  "rounded-2xl": true,
};

const bottomContainerClasses = {
  "modal-container": true,
  "modal-container--bottom": true,
  fixed: true,
  "bottom-0": true,
  "left-0": true,
  "right-0": true,
  "overflow-hidden": true,
  "bg-canvas-sheet": true,
  "rounded-t-2xl": true,
  "rounded-b-none": true,
};

const panelContainerClasses = {
  "modal-container": true,
  "modal-container--panel": true,
  fixed: true,
  "right-0": true,
  "top-0": true,
  flex: true,
  "flex-col": true,
  "overflow-hidden": true,
  "bg-canvas-sheet": true,
  "rounded-2xl": true,
  "m-16": true,
};

@customElement("ledger-modal")
@tailwindElement(styles)
export class LedgerModal extends LitElement {
  @consume({ context: langContext, subscribe: true })
  @property({ attribute: false })
  public languages!: LanguageContext;

  @property({ type: String })
  mode: ModalMode = "center";

  @state()
  private isClosing = false;

  @query(".modal-wrapper")
  private wrapperElement!: HTMLElement;

  @query(".modal-backdrop")
  private backdropElement!: HTMLElement;

  @query(".modal-container")
  private containerElement!: HTMLElement;

  private animationController = new ModalAnimationController(this);
  private focusController = new ModalFocusController(this);
  private scrollLockController = new ModalScrollLockController(this);
  private pendingMorph: {
    targetRect: DOMRect;
    position?: FloatingButtonPosition;
  } | null = null;

  public openModal(mode: ModalMode = "center"): void {
    this.mode = mode;
    this.dispatchEvent(
      new CustomEvent("modal-opened", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Trigger the close animation. Pass `morph` to fly the modal into the
   * floating-button slot (used at the end of the connection-success
   * flow); otherwise the modal just fades / slides out.
   */
  public closeModal(options?: {
    morph?: { targetRect: DOMRect; position?: FloatingButtonPosition };
  }): void {
    if (this.isClosing) {
      return;
    }

    this.pendingMorph = options?.morph ?? null;
    this.dispatchEvent(
      new CustomEvent("modal-closed", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("modal-opened", this.handleOpen);
    this.addEventListener("modal-closed", this.handleClose);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("modal-opened", this.handleOpen);
    this.removeEventListener("modal-closed", this.handleClose);
  }

  private handleOpen = async (): Promise<void> => {
    this.scrollLockController.lock();

    await this.updateComplete;

    this.animationController.animateOpen(
      {
        backdrop: this.backdropElement,
        container: this.containerElement,
        wrapper: this.wrapperElement,
      },
      this.mode,
    );

    this.focusController.activate(this.containerElement, () =>
      this.closeModal(),
    );
  };

  private handleClose = async (): Promise<void> => {
    this.isClosing = true;
    this.focusController.deactivate();

    const elements = {
      backdrop: this.backdropElement,
      container: this.containerElement,
      wrapper: this.wrapperElement,
    };

    const morph = this.pendingMorph;
    this.pendingMorph = null;

    if (morph) {
      // The morph close has two interesting moments:
      //  - `onLanded`: the bezier reached the floating-button slot, which
      //    is the cue for the real `<ledger-floating-button>` to take
      //    over the same pixels.
      //  - the await below: the morph fully resolved; safe to tear down
      //    navigation state and report the close as done.
      await this.animationController.animateMorphClose(
        elements,
        morph.targetRect,
        morph.position,
        () => this.dispatchCloseFinished(),
      );
    } else {
      await this.animationController.animateClose(elements, this.mode);
      this.dispatchCloseFinished();
    }

    this.scrollLockController.unlock();
    this.isClosing = false;
    this.dispatchAnimationComplete();
  };

  private dispatchAnimationComplete(): void {
    this.dispatchEvent(
      new CustomEvent("modal-animation-complete", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Fired at the moment the floating button can take over from the modal:
   *  - regular close: at the end of the close animation.
   *  - morph close:   when the morphed pill lands in the FB slot (before
   *                   the animation fully resolves).
   */
  private dispatchCloseFinished(): void {
    this.dispatchEvent(
      new CustomEvent("modal-close-finished", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderBackdrop() {
    return html`
      <div
        class="modal-backdrop"
        data-testid="modal-backdrop"
        @click=${this.closeModal}
      ></div>
    `;
  }

  private renderToolbar() {
    const appTitle = this.languages?.currentTranslation?.common?.appTitle;

    return html`
      <div class="modal-toolbar">
        <slot name="toolbar">
          <ledger-toolbar
            title=${appTitle}
            aria-label=${appTitle}
            @ledger-toolbar-close=${this.closeModal}
          ></ledger-toolbar>
        </slot>
      </div>
    `;
  }

  private renderContent() {
    return html`
      <div
        id="modal-content"
        class="scrollbar-custom relative flex-1 overflow-y-auto text-base"
      >
        <slot></slot>
      </div>
    `;
  }

  private renderCenterContainer() {
    return html`
      <div
        class=${classMap(centerContainerClasses)}
        role="dialog"
        aria-modal="true"
        aria-describedby="modal-content"
        @click=${(e: Event) => e.stopPropagation()}
      >
        ${this.renderToolbar()} ${this.renderContent()}
      </div>
    `;
  }

  private renderBottomContainer() {
    return html`
      <div
        class=${classMap(bottomContainerClasses)}
        role="dialog"
        aria-modal="true"
        aria-describedby="modal-content"
      >
        ${this.renderToolbar()} ${this.renderContent()}
      </div>
    `;
  }

  private renderPanelContainer() {
    return html`
      <div
        class=${classMap(panelContainerClasses)}
        role="dialog"
        aria-modal="true"
        aria-describedby="modal-content"
        @click=${(e: Event) => e.stopPropagation()}
      >
        ${this.renderToolbar()} ${this.renderContent()}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="modal-wrapper">
        ${this.renderBackdrop()}
        ${(() => {
          switch (this.mode) {
            case "panel":
              return this.renderPanelContainer();
            case "bottom":
              return this.renderBottomContainer();
            case "center":
            default:
              return this.renderCenterContainer();
          }
        })()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ledger-modal": LedgerModal;
  }

  interface WindowEventMap {
    "modal-opened": CustomEvent<void>;
    "modal-closed": CustomEvent<void>;
    "modal-animation-complete": CustomEvent<void>;
    "modal-close-finished": CustomEvent<void>;
  }
}
