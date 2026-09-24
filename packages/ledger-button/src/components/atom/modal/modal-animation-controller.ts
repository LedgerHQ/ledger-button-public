import { ReactiveController, ReactiveControllerHost } from "lit";
import { animate } from "motion";

import { ANIMATION_DELAY } from "../../../shared/navigation";
import type { FloatingButtonPosition } from "../floating-button/ledger-floating-button";
import { type AnimationInstance } from "./animation-types";
import { BottomAnimation } from "./bottom-animation";
import { CenterAnimation } from "./center-animation";
import { MorphAnimation } from "./morph-animation";
import { PanelAnimation } from "./panel-animation";

export type ModalMode = "center" | "panel" | "bottom";

const WRAPPER_OPEN_CLASS = "modal-wrapper--open";
const BACKDROP_SETTLED_CLASS = "modal-backdrop--settled";
const CONTAINER_SETTLED_CLASS = "modal-container--settled";

type AnimationElements = {
  backdrop: HTMLElement;
  container: HTMLElement;
  wrapper: HTMLElement;
};

export class ModalAnimationController implements ReactiveController {
  private backdropAnimation: AnimationInstance | null = null;
  private isOpen = false;
  private openGeneration = 0;
  private readonly centerAnimation = new CenterAnimation();
  private readonly panelAnimation = new PanelAnimation();
  private readonly morphAnimation = new MorphAnimation();
  private readonly bottomAnimation = new BottomAnimation();

  constructor(private readonly host: ReactiveControllerHost) {
    this.host.addController(this);
  }

  hostDisconnected(): void {
    this.endOpenSession();
    this.cancelAnimations();
  }

  animateOpen(elements: AnimationElements, mode: ModalMode): void {
    // Opening an already open modal (mode switch, repeated navigation intent)
    // must not replay the animation: cancelling the live one blanks the modal
    // for a frame. A mode switch renders a brand new container, so it only
    // needs to be put in the state the finished animation would have left it.
    if (this.isOpen) {
      elements.wrapper.classList.add(WRAPPER_OPEN_CLASS);
      elements.backdrop.classList.add(BACKDROP_SETTLED_CLASS);
      elements.container.classList.add(CONTAINER_SETTLED_CLASS);
      return;
    }

    this.isOpen = true;
    const generation = ++this.openGeneration;
    this.cancelAnimations();
    this.resetVisualState(elements);

    elements.wrapper.classList.add(WRAPPER_OPEN_CLASS);

    const backdropFade = new Promise<void>((resolve) => {
      this.backdropAnimation = animate(
        elements.backdrop,
        { opacity: [0, 1] },
        {
          duration: ANIMATION_DELAY / 1000,
          ease: "easeOut",
          onComplete: () => resolve(),
        },
      );
    });

    this.settleOnComplete(
      backdropFade,
      generation,
      elements.backdrop,
      BACKDROP_SETTLED_CLASS,
    );
    this.settleOnComplete(
      this.openContainer(elements.container, mode),
      generation,
      elements.container,
      CONTAINER_SETTLED_CLASS,
    );
  }

  async animateClose(
    elements: AnimationElements,
    mode: ModalMode,
  ): Promise<void> {
    this.endOpenSession();
    const animations: Promise<void>[] = [];

    if (mode === "panel") {
      animations.push(this.panelAnimation.close(elements.container));
    } else if (mode === "bottom") {
      animations.push(this.bottomAnimation.close(elements.container));
    } else {
      animations.push(this.centerAnimation.close(elements.container));
    }

    animations.push(
      new Promise<void>((resolve) => {
        this.backdropAnimation = animate(
          elements.backdrop,
          { opacity: [1, 0] },
          {
            duration: ANIMATION_DELAY / 1000,
            onComplete: () => resolve(),
          },
        );
      }),
    );

    await Promise.all(animations);

    this.resetVisualState(elements);
    this.backdropAnimation = null;
  }

  async animateMorphClose(
    elements: AnimationElements,
    targetRect: DOMRect,
    position?: FloatingButtonPosition,
    onLanded?: () => void,
  ): Promise<void> {
    this.endOpenSession();
    const backdropFade = new Promise<void>((resolve) => {
      this.backdropAnimation = animate(
        elements.backdrop,
        { opacity: [1, 0] },
        {
          duration: ANIMATION_DELAY / 1000,
          ease: "easeOut",
          onComplete: () => resolve(),
        },
      );
    });

    await Promise.all([
      this.morphAnimation.morphClose(
        elements.container,
        targetRect,
        position,
        onLanded,
      ),
      backdropFade,
    ]);

    this.resetVisualState(elements);
    this.backdropAnimation = null;
  }

  cancelAnimations(): void {
    if (this.backdropAnimation) {
      this.backdropAnimation.cancel();
      this.backdropAnimation = null;
    }

    this.centerAnimation.cancel();
    this.panelAnimation.cancel();
    this.bottomAnimation.cancel();
    this.morphAnimation.cancel();
  }

  /**
   * Bumping the generation invalidates the pending settle callbacks, so an
   * open animation completing late can never pin the open state back onto a
   * modal that has since been closed.
   */
  private endOpenSession(): void {
    this.isOpen = false;
    this.openGeneration++;
  }

  private openContainer(
    container: HTMLElement,
    mode: ModalMode,
  ): Promise<void> {
    if (mode === "panel") {
      return this.panelAnimation.open(container);
    }

    if (mode === "bottom") {
      return this.bottomAnimation.open(container);
    }

    return this.centerAnimation.open(container);
  }

  /**
   * Hands the element over to its open resting state in the microtask that
   * follows the animation completing, which still runs before that frame is
   * painted - the frame where Motion has already cancelled the WAAPI animation
   * but has not written the final value back yet.
   */
  private settleOnComplete(
    animation: Promise<void>,
    generation: number,
    element: HTMLElement,
    className: string,
  ): void {
    void animation.then(() => {
      if (generation !== this.openGeneration) {
        return;
      }
      element.classList.add(className);
    });
  }

  private resetVisualState(elements: AnimationElements): void {
    elements.wrapper.classList.remove(WRAPPER_OPEN_CLASS);
    elements.backdrop.classList.remove(BACKDROP_SETTLED_CLASS);
    elements.container.classList.remove(CONTAINER_SETTLED_CLASS);
    this.resetContainerVisualState(elements.container);
    this.resetBackdropVisualState(elements.backdrop);
  }

  private resetContainerVisualState(container: HTMLElement): void {
    container.style.transform = "";
    container.style.borderRadius = "";
    container.style.opacity = "";

    const children = Array.from(container.children) as HTMLElement[];
    for (const child of children) {
      child.style.opacity = "";
    }
  }

  private resetBackdropVisualState(backdrop: HTMLElement): void {
    backdrop.style.opacity = "";
  }
}
