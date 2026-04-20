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

// Phase 3: Bezier move (starts at midpoint of phase 2)
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
const PHASE3_START = PHASE2_START + SCALE_DOWN_DURATION / 2;
const TOTAL_DURATION = PHASE3_START + MOVE_DURATION + SETTLE_FADE_DURATION;

export class MorphAnimation {
  private animations: AnimationInstance[] = [];
  private phase2Animation: AnimationInstance | null = null;

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
    this.phase2Animation = null;
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
      this.phase2Animation = anim;
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
      this.cancelPhase2Conflicts();

      const startScale = readCurrentScale(container);
      const startBorderRadiusPx = readCurrentBorderRadiusPx(container);
      const progress = { t: 0 };

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
            const scale = lerp(startScale, finalScale, t);
            const radius = lerp(startBorderRadiusPx, finalBorderRadiusPx, t);
            container.style.transform = `translate(${point.x}px, ${point.y}px) scale(${scale})`;
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

  /**
   * Phase 2 is still running when phase 3 starts (intentional overlap).
   * We stop its scale animation so the onUpdate-driven trajectory becomes
   * the single source of truth. `stop()` (unlike `cancel()`) commits the
   * current sampled transform to the inline style before tearing down the
   * underlying WAAPI animation, so the immediately-following
   * `readCurrentScale` sees the real mid-animation value instead of the
   * reverted initial state — preventing a one-frame snap back to full size.
   */
  private cancelPhase2Conflicts(): void {
    if (this.phase2Animation) {
      this.phase2Animation.stop();
      this.phase2Animation = null;
    }
  }

  private delay(seconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function readCurrentScale(element: HTMLElement): number {
  const transform = getComputedStyle(element).transform;
  if (!transform || transform === "none") {
    return 1;
  }
  try {
    const matrix = new DOMMatrixReadOnly(transform);
    return matrix.a;
  } catch {
    return 1;
  }
}

function readCurrentBorderRadiusPx(element: HTMLElement): number {
  const value = getComputedStyle(element).borderTopLeftRadius;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
