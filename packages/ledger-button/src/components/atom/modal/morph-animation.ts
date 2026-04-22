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
const DEBUG_SLOWDOWN = 1.5;

/**
 * Debug helper: when true, the morph never fades out and `morphClose`
 * never resolves, so the modal stays frozen at its final state for
 * inspection in DevTools. Set to false for normal playback.
 */
const DEBUG_KEEP_VISIBLE = false;

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
/**
 * Fraction of MOVE_DURATION over which the shape morph (scale + border
 * radius) completes. The bezier translate keeps running until the end, so
 * the last (1 - MORPH_FINISH_RATIO) of the trajectory is a fully-formed
 * pill gliding into the floating-button slot.
 */
const MORPH_FINISH_RATIO = 0.6;
/**
 * The morph used to fade itself out after the bezier move landed. We
 * now leave the morphed pill in place at the floating-button slot and
 * let the real `<ledger-floating-button>` (rendered above the modal
 * z-index) take over the same pixels: the swap is invisible, and the
 * Ledger logo fades in inside the button.
 */
const POST_LANDING_HOLD_DURATION = 0 * DEBUG_SLOWDOWN;

/** Default position used when the caller does not specify one */
const DEFAULT_POSITION: FloatingButtonPosition = "bottom-right";

// Computed phase start times (seconds from morphClose start)
const PHASE2_START = CONTENT_FADE_DURATION - MORPH_OVERLAP;
const PHASE3_START = PHASE2_START + SCALE_DOWN_DURATION - PHASE2_PHASE3_OVERLAP;
const TOTAL_DURATION =
  PHASE3_START + MOVE_DURATION + POST_LANDING_HOLD_DURATION;

/**
 * All transform animations share a single
 * `transformState = { tx, ty, sx, sy }` object and a single render
 * function that writes `style.transform` once per frame as
 * `translate(...) scale(...)`. Animations only mutate the shared state
 * and call the render function:
 *
 * - The scale animation is a single keyframe animation:
 *     `(sx, sy)` goes from `(1, 1) → (intermediateScaleX, intermediateScaleY)
 *      → (finalScaleX, finalScaleY)`,
 *   with the intermediate keyframe placed so that the first leg lasts
 *   SCALE_DOWN_DURATION and the second leg fits within
 *   `MOVE_DURATION * MORPH_FINISH_RATIO`. Using one animation
 *   sidesteps any race or cancel-handoff between two concurrent
 *   tweens writing to the same property.
 *   `intermediateScale{X,Y}` is non-uniform, chosen so that the
 *   intermediate visual aspect ratio already matches the target
 *   (so the second leg only does a tiny uniform zoom and never has
 *   to morph the box from a rectangle into a square at the end).
 * - The bezier `move` drives `(tx, ty)` in its `onUpdate`, then
 *   re-renders. So translate and scale always go through the SAME
 *   `applyTransform` write, never clobber each other.
 * - A separate animation interpolates an elliptical `borderRadius`
 *   and writes it to the container in its `onUpdate`
 *   (`borderRadius: "${rx}px / ${ry}px"`).
 *
 * The scale and radius animations finish early (so they're done at
 * `MORPH_FINISH_RATIO` of the move) — the bezier translate carries
 * an already-formed pill the rest of the way.
 */
type TransformState = { tx: number; ty: number; sx: number; sy: number };

export class MorphAnimation {
  private animations: AnimationInstance[] = [];
  private transformState: TransformState = { tx: 0, ty: 0, sx: 1, sy: 1 };

  async morphClose(
    container: HTMLElement,
    targetRect: DOMRect,
    position: FloatingButtonPosition = DEFAULT_POSITION,
    onLanded?: () => void,
  ): Promise<void> {
    this.cancel();
    this.transformState = { tx: 0, ty: 0, sx: 1, sy: 1 };

    const containerRect = container.getBoundingClientRect();

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;

    const deltaX = targetCenterX - containerCenterX;
    const deltaY = targetCenterY - containerCenterY;
    // Non-uniform scale so the visual end size matches targetRect exactly
    // (the modal's source aspect ratio is generally not 1:1).
    const finalScaleX = targetRect.width / containerRect.width;
    const finalScaleY = targetRect.height / containerRect.height;
    // Intermediate scale: keep the visual width at SCALE_DOWN_TARGET *
    // containerRect.width (so phase 2 still feels like a "shrink"), but
    // pick the y-scale so the intermediate visual aspect ratio already
    // matches the target. That way the final keyframe only needs to do a
    // tiny uniform zoom to land exactly on targetRect.{width,height},
    // avoiding a visible rectangle → square morph at the very end.
    const intermediateScaleX = SCALE_DOWN_TARGET;
    const intermediateScaleY =
      SCALE_DOWN_TARGET *
      (containerRect.width / containerRect.height) *
      (targetRect.height / targetRect.width);
    // Elliptical border radius. Visual radius after non-uniform scale is
    // preRadius * scaleAxis, so to land at a perfect circle of diameter
    // targetRect.{width,height} the pre-scale radii must be:
    //   rxPre = (targetRect.width  / 2) / finalScaleX = containerRect.width  / 2
    //   ryPre = (targetRect.height / 2) / finalScaleY = containerRect.height / 2
    const finalRadiusXPx = containerRect.width / 2;
    const finalRadiusYPx = containerRect.height / 2;
    const controlPoints = getMorphControlPoints(position, deltaX, deltaY);

    // Single keyframe scale animation that spans phase 2 + phase 3.
    // Lands at (finalScaleX, finalScaleY) when the morph should finish,
    // i.e. at PHASE3_START + MOVE_DURATION * MORPH_FINISH_RATIO.
    const scaleTotalDuration =
      PHASE3_START + MOVE_DURATION * MORPH_FINISH_RATIO - PHASE2_START;
    const scaleMidFraction = SCALE_DOWN_DURATION / scaleTotalDuration;

    this.startPhase1(container);
    this.scheduleScale(
      container,
      intermediateScaleX,
      intermediateScaleY,
      finalScaleX,
      finalScaleY,
      PHASE2_START,
      scaleTotalDuration,
      scaleMidFraction,
    );
    this.schedulePhase3(
      container,
      controlPoints,
      finalRadiusXPx,
      finalRadiusYPx,
      PHASE3_START,
      onLanded,
    );

    await this.delay(TOTAL_DURATION);
    this.animations = [];

    if (DEBUG_KEEP_VISIBLE) {
      // Park forever so the controller never tears down the wrapper.
      // Refresh the page to reset.
      await new Promise<void>(() => {
        /* never resolves */
      });
    }
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

  private scheduleScale(
    container: HTMLElement,
    intermediateScaleX: number,
    intermediateScaleY: number,
    finalScaleX: number,
    finalScaleY: number,
    startAt: number,
    totalDuration: number,
    midTimeFraction: number,
  ): void {
    setTimeout(() => {
      const anim = animate(
        this.transformState,
        {
          sx: [1, intermediateScaleX, finalScaleX],
          sy: [1, intermediateScaleY, finalScaleY],
        },
        {
          duration: totalDuration,
          times: [0, midTimeFraction, 1],
          ease: [SCALE_DOWN_EASING, SCALE_DOWN_EASING],
          onUpdate: () => this.applyTransform(container),
        },
      );
      this.animations.push(anim);
    }, startAt * 1000);
  }

  private schedulePhase3(
    container: HTMLElement,
    controlPoints: MorphControlPoints,
    finalRadiusXPx: number,
    finalRadiusYPx: number,
    startAt: number,
    onLanded?: () => void,
  ): void {
    setTimeout(() => {
      const startBorderRadiusPx = readCurrentBorderRadiusPx(container);
      const progress = { t: 0 };
      const radiusState = {
        rx: startBorderRadiusPx,
        ry: startBorderRadiusPx,
      };
      const shapeDuration = MOVE_DURATION * MORPH_FINISH_RATIO;

      const radiusAnim = animate(
        radiusState,
        { rx: finalRadiusXPx, ry: finalRadiusYPx },
        {
          duration: shapeDuration,
          ease: "easeOut",
          onUpdate: () => {
            container.style.borderRadius = `${radiusState.rx}px / ${radiusState.ry}px`;
          },
        },
      );
      this.animations.push(radiusAnim);

      const move = animate(
        progress,
        { t: 1 },
        {
          duration: MOVE_DURATION,
          ease: MOVE_EASING,
          onUpdate: () => {
            const point = cubicBezier(
              progress.t,
              controlPoints.p0,
              controlPoints.p1,
              controlPoints.p2,
              controlPoints.p3,
            );
            this.transformState.tx = point.x;
            this.transformState.ty = point.y;
            this.applyTransform(container);
          },
        },
      );
      this.animations.push(move);

      setTimeout(() => {
        onLanded?.();
      }, MOVE_DURATION * 1000);
    }, startAt * 1000);
  }

  private delay(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  /**
   * Single source of truth for the container's transform. Always writes
   * `translate(...) scale(...)` so that phase 2 (uniform scale) and
   * phase 3 (translate + non-uniform scale) cannot clobber each other,
   * and no individual CSS transform property (`scale`, `translate`) is
   * ever read or set independently.
   */
  private applyTransform(container: HTMLElement): void {
    const { tx, ty, sx, sy } = this.transformState;
    container.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
  }
}

function readCurrentBorderRadiusPx(element: HTMLElement): number {
  const value = getComputedStyle(element).borderTopLeftRadius;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
