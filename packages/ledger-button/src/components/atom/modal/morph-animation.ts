import { animate, Easing } from "motion";

import type { FloatingButtonPosition } from "../floating-button/ledger-floating-button.js";
import { type AnimationInstance } from "./animation-types.js";
import {
  cubicBezier,
  getMorphControlPoints,
  type MorphControlPoints,
} from "./morph-path.js";

// Debug helper: multiply every phase duration to slow the whole animation
// down for easier inspection. Set to 1 for normal playback.
const DEBUG_SLOWDOWN = 10;

// Phase 1: Content Fade
/** How long the modal content (toolbar + status) fades to transparent */
const CONTENT_FADE_DURATION = 0.26 * DEBUG_SLOWDOWN;

// Phase 2: Scale Down (overlaps with end of phase 1)
/** How early phase 2 starts before phase 1 ends */
const MORPH_OVERLAP = 0.1 * DEBUG_SLOWDOWN;
/** How long the modal shrinks in place */
const SCALE_DOWN_DURATION = 0.3 * DEBUG_SLOWDOWN;
/** Target scale when the shrink ends (before the move) */
const SCALE_DOWN_TARGET = 0.15;
/** Easing for the scale-down phase */
const SCALE_DOWN_EASING: Easing = [0.4, 0, 0.2, 1];

// Phase 3: Bezier move (overlaps with end of phase 2)
/** How early phase 3 starts before phase 2 ends */
const PHASE2_PHASE3_OVERLAP = 0.3 * DEBUG_SLOWDOWN;
/** How long the Bezier trajectory takes */
const MOVE_DURATION = 0.6 * DEBUG_SLOWDOWN;
/** Easing applied to the parameter t in [0, 1] driving the Bezier */
const MOVE_EASING: Easing = [0.33, 0, 0.2, 1];
/** Quick fade-out after the move settles */
const SETTLE_FADE_DURATION = 0.12 * DEBUG_SLOWDOWN;

/** Default position used when the caller does not specify one */
const DEFAULT_POSITION: FloatingButtonPosition = "bottom-right";

// Computed phase start times (seconds from morphClose start)
const PHASE2_START = CONTENT_FADE_DURATION - MORPH_OVERLAP;
const PHASE3_START = PHASE2_START + SCALE_DOWN_DURATION - PHASE2_PHASE3_OVERLAP;
const TOTAL_DURATION = PHASE3_START + MOVE_DURATION + SETTLE_FADE_DURATION;

/**
 * Phases 2 and 3 run concurrently (phase 3 starts at phase 2's midpoint).
 * To avoid the two animations fighting over the same CSS `transform`
 * property, each phase writes to a disjoint CSS surface:
 *
 * - Phase 2 animates the `scale` CSS property (via Motion).
 * - Phase 3 writes the `translate` CSS property and `borderRadius` in its
 *   `onUpdate`, and issues a separate Motion animation that retargets
 *   `scale` to the final value. Motion naturally picks up the in-flight
 *   scale value, so phase 2's animation is seamlessly superseded without
 *   any manual stop/read/resume dance.
 *
 * This mirrors the phase 1 ↔ phase 2 overlap, which already works because
 * they target disjoint properties (`opacity` on children vs `scale` on the
 * container).
 */
export class MorphAnimation {
  private animations: AnimationInstance[] = [];

  async morphClose(
    container: HTMLElement,
    targetRect: DOMRect,
    position: FloatingButtonPosition = DEFAULT_POSITION,
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
    const finalBorderRadiusPx = containerRect.width / 2;
    const controlPoints = getMorphControlPoints(position, deltaX, deltaY);

    this.startPhase1(container);
    this.schedulePhase2(container, PHASE2_START);
    this.schedulePhase3(
      container,
      controlPoints,
      finalScale,
      finalBorderRadiusPx,
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
    controlPoints: MorphControlPoints,
    finalScale: number,
    finalBorderRadiusPx: number,
    startAt: number,
  ): void {
    setTimeout(() => {
      const startBorderRadiusPx = readCurrentBorderRadiusPx(container);
      const progress = { t: 0 };

      // Retargets `scale` to the final value. Motion seamlessly takes over
      // from phase 2's in-flight scale animation (same element, same CSS
      // property) without needing to stop/read it manually.
      const scaleAnim = animate(
        container,
        { scale: finalScale },
        {
          duration: MOVE_DURATION,
          ease: MOVE_EASING,
        },
      );
      this.animations.push(scaleAnim);

      const move = animate(
        progress,
        { t: 1 },
        {
          duration: MOVE_DURATION,
          ease: MOVE_EASING,
          onUpdate: () => {
            const t = progress.t;
            const point = cubicBezier(
              t,
              controlPoints.p0,
              controlPoints.p1,
              controlPoints.p2,
              controlPoints.p3,
            );
            const radius = lerp(startBorderRadiusPx, finalBorderRadiusPx, t);
            container.style.translate = `${point.x}px ${point.y}px`;
            container.style.borderRadius = `${radius}px`;
          },
        },
      );
      this.animations.push(move);

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

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function readCurrentBorderRadiusPx(element: HTMLElement): number {
  const value = getComputedStyle(element).borderTopLeftRadius;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
