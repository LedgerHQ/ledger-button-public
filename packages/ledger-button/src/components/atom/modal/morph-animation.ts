import { animate, Easing } from "motion";

import { type AnimationInstance } from "./animation-types.js";

// ── Phase 1: Content Fade ──────────────────────────────────────────
/** How long the modal content (toolbar + status) fades to transparent */
const CONTENT_FADE_DURATION = 0.26;

// ── Phase 2: Scale Down (overlaps with end of phase 1) ─────────────
/** How early phase 2 starts before phase 1 ends */
const MORPH_OVERLAP = 0.1;
/** How long the modal shrinks in place */
const SCALE_DOWN_DURATION = 0.3;
/** Target scale when the shrink ends (before the move) */
const SCALE_DOWN_TARGET = 0.35;
/** Border radius at the end of the shrink */
const SCALE_DOWN_BORDER_RADIUS = "24px";
/** Easing for the scale-down phase */
const SCALE_DOWN_EASING: Easing = [0.4, 0, 0.2, 1];

// ── Phase 3: Elliptic Move (starts at midpoint of phase 2) ─────────
/** How long the elliptic curve movement takes */
const MOVE_DURATION = 0.6;
/** Border radius at destination (circular floating button) */
const FINAL_BORDER_RADIUS = "9999px";
/** Easing for the scale/shape sub-animation */
const MOVE_SHAPE_EASING: Easing = [0.33, 0, 0.67, 1];
/** Easing for the X axis of the elliptic move */
const MOVE_X_EASING: Easing = [0.33, 0, 0.67, 1];
/** Easing for the Y axis of the elliptic move */
const MOVE_Y_EASING: Easing = [0.33, 0, 0.2, 1];
/** How far past the target X the overshoot goes (1.08 = 8% past) */
const OVERSHOOT_FACTOR = 1.08;
/** At what point in the animation the overshoot peak occurs (0-1) */
const OVERSHOOT_PEAK = 0.75;
/** Quick fade-out after the move settles */
const SETTLE_FADE_DURATION = 0.12;

// ── Computed phase start times (seconds from morphClose start) ──────
const PHASE2_START = CONTENT_FADE_DURATION - MORPH_OVERLAP;
const PHASE3_START = PHASE2_START + SCALE_DOWN_DURATION / 2;
const TOTAL_DURATION =
  PHASE3_START + MOVE_DURATION + SETTLE_FADE_DURATION;

export class MorphAnimation {
  private animations: AnimationInstance[] = [];

  async morphClose(
    container: HTMLElement,
    targetRect: DOMRect,
  ): Promise<void> {
    this.cancel();

    const containerRect = container.getBoundingClientRect();

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;

    const deltaX = targetCenterX - containerCenterX;
    const deltaY = targetCenterY - containerCenterY;
    const finalScale = targetRect.width / containerRect.width;

    this.startPhase1(container);
    this.schedulePhase2(container, PHASE2_START);
    this.schedulePhase3(
      container,
      deltaX,
      deltaY,
      finalScale,
      PHASE3_START,
    );

    await this.delay(TOTAL_DURATION);
    this.animations = [];
  }

  cancel(): void {
    for (const anim of this.animations) {
      anim.cancel();
    }
    this.animations = [];
  }

  private startPhase1(container: HTMLElement): void {
    const children = Array.from(container.children) as HTMLElement[];
    for (const child of children) {
      const anim = animate(
        child,
        { opacity: 0 },
        { duration: CONTENT_FADE_DURATION, ease: "easeOut" },
      );
      this.animations.push(anim);
    }
  }

  private schedulePhase2(container: HTMLElement, startAt: number): void {
    setTimeout(() => {
      const anim = animate(
        container,
        {
          scale: SCALE_DOWN_TARGET,
          borderRadius: SCALE_DOWN_BORDER_RADIUS,
        },
        {
          duration: SCALE_DOWN_DURATION,
          ease: SCALE_DOWN_EASING,
        },
      );
      this.animations.push(anim);
    }, startAt * 1000);
  }

  private schedulePhase3(
    container: HTMLElement,
    deltaX: number,
    deltaY: number,
    finalScale: number,
    startAt: number,
  ): void {
    setTimeout(() => {
      const moveX = animate(
        container,
        { x: [0, deltaX * OVERSHOOT_FACTOR, deltaX] },
        {
          duration: MOVE_DURATION,
          ease: MOVE_X_EASING,
          times: [0, OVERSHOOT_PEAK, 1],
        },
      );
      this.animations.push(moveX);

      const moveY = animate(
        container,
        { y: deltaY },
        { duration: MOVE_DURATION, ease: MOVE_Y_EASING },
      );
      this.animations.push(moveY);

      const scaleAndShape = animate(
        container,
        { scale: finalScale, borderRadius: FINAL_BORDER_RADIUS },
        { duration: MOVE_DURATION, ease: MOVE_SHAPE_EASING },
      );
      this.animations.push(scaleAndShape);

      setTimeout(() => {
        const settleFade = animate(
          container,
          { opacity: 0 },
          { duration: SETTLE_FADE_DURATION, ease: "easeOut" },
        );
        this.animations.push(settleFade);
      }, MOVE_DURATION * 1000);
    }, startAt * 1000);
  }

  private delay(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }
}
