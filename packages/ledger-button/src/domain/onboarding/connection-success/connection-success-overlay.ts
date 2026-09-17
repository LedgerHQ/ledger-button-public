import "../../../components/index";

import { consume } from "@lit/context";
import { css, html, LitElement, type PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { animate } from "motion";

import type { FloatingButtonPosition } from "../../../components/atom/floating-button/ledger-floating-button";
import { type AnimationInstance } from "../../../components/atom/modal/animation-types";
import { ModalFocusController } from "../../../components/atom/modal/modal-focus-controller";
import { ModalScrollLockController } from "../../../components/atom/modal/modal-scroll-lock-controller";
import { MorphAnimation } from "../../../components/atom/modal/morph-animation";
import {
  langContext,
  type LanguageContext,
} from "../../../context/language-context";
import { ANIMATION_DELAY } from "../../../shared/navigation";
import { tailwindElement } from "../../../tailwind-element";

const CONNECTION_SUCCESS_TITLE_ID = "connection-success-overlay-title";
const CONNECTION_SUCCESS_SUBTITLE_ID = "connection-success-overlay-subtitle";

const styles = css`
  :host {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: block;
  }

  .connection-success-overlay__backdrop {
    position: absolute;
    inset: 0;
    opacity: 0;
    background: radial-gradient(
      50% 50% at 50% 50%,
      rgba(102, 102, 102, 0.6) 0%,
      rgba(0, 0, 0, 0.6) 100%
    );
    backdrop-filter: blur(calc(var(--blur-md, 12px) / 2));
  }

  .connection-success-overlay__container {
    position: absolute;
    inset: 0;
    z-index: 1;
    margin: auto;
    width: min(calc(100% - 32px), 400px);
    height: min(400px, calc(100vh - 64px));
    overflow: hidden;
    opacity: 0;
  }
`;

@customElement("connection-success-overlay")
@tailwindElement(styles)
export class ConnectionSuccessOverlay extends LitElement {
  @property({ attribute: false })
  public targetRect!: DOMRect;

  @property({ type: String })
  public position: FloatingButtonPosition = "bottom-right";

  @property({ type: Boolean })
  public morph = true;

  @property({ type: Number, attribute: false })
  public runId = 0;

  @consume({ context: langContext })
  @property({ attribute: false })
  public languages!: LanguageContext;

  @query(".connection-success-overlay__backdrop")
  private readonly backdropElement!: HTMLElement;

  @query(".connection-success-overlay__container")
  private readonly containerElement!: HTMLElement;

  private readonly morphAnimation = new MorphAnimation();
  private readonly focusController = new ModalFocusController(this);
  private readonly scrollLockController = new ModalScrollLockController(this);
  private backdropAnimation: AnimationInstance | null = null;
  private containerAnimation: AnimationInstance | null = null;
  private isClosing = false;
  private pendingStart = true;
  private activeRunToken = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.pendingStart = true;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.activeRunToken += 1;
    this.cancelAnimations();
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (
      changedProperties.has("runId") ||
      changedProperties.has("targetRect") ||
      changedProperties.has("position")
    ) {
      this.pendingStart = true;
    }

    if (this.pendingStart && this.backdropElement && this.containerElement) {
      this.pendingStart = false;
      void this.startRun();
    }
  }

  override render() {
    const translations = this.languages.currentTranslation;

    return html`
      <div class="connection-success-overlay__backdrop"></div>
      <div
        class="connection-success-overlay__container bg-canvas-sheet rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby=${CONNECTION_SUCCESS_TITLE_ID}
        aria-describedby=${CONNECTION_SUCCESS_SUBTITLE_ID}
      >
        <div
          class="bg-gradient-success pointer-events-none absolute inset-0"
          aria-hidden="true"
        ></div>
        <div class="relative flex h-full flex-col gap-32 p-24">
          <div class="flex w-full shrink-0 items-center justify-between">
            <div class="flex h-32 w-32 items-center justify-center">
              <ledger-icon type="ledger" .size=${24}></ledger-icon>
            </div>
            <div class="flex h-32 w-32 items-center justify-center">
              <ledger-button
                .icon=${true}
                variant="noBackground"
                iconType="close"
                size="xs"
                @click=${this.handleClose}
              ></ledger-button>
            </div>
          </div>
          <div class="flex flex-1 flex-col items-center justify-center gap-24">
            <div
              class="bg-muted-transparent text-success flex h-72 w-72 items-center justify-center rounded-full p-12"
            >
              <ledger-icon
                type="checkMarkCircleFill"
                size="40"
                fillColor="currentColor"
              ></ledger-icon>
            </div>
            <div class="flex w-full flex-col gap-8 text-center">
              <h2
                id=${CONNECTION_SUCCESS_TITLE_ID}
                class="heading-3-semi-bold text-base"
              >
                ${translations.onboarding.connectionSuccess.title}
              </h2>
              <p
                id=${CONNECTION_SUCCESS_SUBTITLE_ID}
                class="text-muted body-2"
              >
                ${translations.onboarding.connectionSuccess.subtitle}
              </p>
            </div>
          </div>
          <ledger-button
            variant="primary"
            size="full"
            .label=${translations.onboarding.connectionSuccess.close}
            @click=${this.handleClose}
          ></ledger-button>
        </div>
      </div>
    `;
  }

  private animateIn(): void {
    this.backdropAnimation = animate(
      this.backdropElement,
      { opacity: [0, 1] },
      { duration: ANIMATION_DELAY / 1000, ease: "easeOut" },
    );

    this.containerAnimation = animate(
      this.containerElement,
      { opacity: [0, 1], y: [16, 0], scale: [0.98, 1] },
      { duration: ANIMATION_DELAY / 1000, ease: "easeOut" },
    );
  }

  private handleClose(): void {
    void this.closeOverlay();
  }

  private async closeOverlay(): Promise<void> {
    if (this.isClosing) {
      return;
    }

    this.isClosing = true;
    this.focusController.deactivate();
    this.cancelAnimations();
    const runToken = this.activeRunToken;

    const backdropFade = new Promise<void>((resolve) => {
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

    if (this.morph) {
      await Promise.all([
        backdropFade,
        this.morphAnimation.morphClose(
          this.containerElement,
          this.targetRect,
          this.position,
        ),
      ]);
    } else {
      const containerFade = new Promise<void>((resolve) => {
        this.containerAnimation = animate(
          this.containerElement,
          { opacity: [1, 0], scale: [1, 0.92] },
          {
            duration: ANIMATION_DELAY / 1000,
            ease: "easeOut",
            onComplete: () => resolve(),
          },
        );
      });
      await Promise.all([backdropFade, containerFade]);
    }

    if (runToken !== this.activeRunToken || !this.isConnected) {
      return;
    }

    this.scrollLockController.unlock();

    this.dispatchEvent(
      new CustomEvent("connection-success-overlay-finished", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private cancelAnimations(): void {
    this.backdropAnimation?.cancel();
    this.backdropAnimation = null;
    this.containerAnimation?.cancel();
    this.containerAnimation = null;
    this.morphAnimation.cancel();
  }

  private async startRun(): Promise<void> {
    this.activeRunToken += 1;
    const runToken = this.activeRunToken;

    this.cancelAnimations();
    this.isClosing = false;
    this.resetVisualState();

    await this.updateComplete;

    if (
      runToken !== this.activeRunToken ||
      !this.isConnected ||
      !this.backdropElement ||
      !this.containerElement
    ) {
      return;
    }

    this.animateIn();
    this.activateFocusTrap();
  }

  private activateFocusTrap(): void {
    this.scrollLockController.lock();
    this.focusController.deactivate();
    this.focusController.activate(this.containerElement, () => {
      void this.closeOverlay();
    });
  }

  private resetVisualState(): void {
    if (this.backdropElement) {
      this.backdropElement.style.opacity = "";
    }

    if (!this.containerElement) {
      return;
    }

    this.containerElement.style.transform = "";
    this.containerElement.style.borderRadius = "";
    this.containerElement.style.opacity = "";

    const children = Array.from(
      this.containerElement.children,
    ) as HTMLElement[];
    for (const child of children) {
      child.style.opacity = "";
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "connection-success-overlay": ConnectionSuccessOverlay;
  }

  interface WindowEventMap {
    "connection-success-overlay-finished": CustomEvent<void>;
  }
}
