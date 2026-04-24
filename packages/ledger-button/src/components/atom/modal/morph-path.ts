import type { FloatingButtonPosition } from "../floating-button/ledger-floating-button.js";

export type Point = { x: number; y: number };

export type MorphControlPoints = {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
};

/**
 * How far the trajectory goes past the target on the dominant axis.
 * 0.08 = 8% beyond the target, then settles back.
 */
export const MORPH_OVERSHOOT = 0.2;

/**
 * Where on the segment P1 sits when the curve is degenerate (straight line).
 * Kept at one third for an even visual cadence between P0 - P1 - P2 - P3.
 */
const STRAIGHT_P1_RATIO = 1 / 3;

/**
 * For corner trajectories, P1 and P2 are derived from a quadratic Bezier
 * with its control point at (0, dy) — directly below (or above) the start.
 * Cubic conversion: P1 = 2/3*P_mid, P2 = P3 + 2/3*(P_mid - P3).
 *
 * This guarantees a clean "first go in Y, then go in X" arc (like a
 * rounded L), with no S-curve by construction. A slight Y-overshoot is
 * applied on P2 to give a gentle spring at landing.
 *
 * No-S-curve proof: both P1 and P2 are on the same side of P0→P3:
 *   P1 cross = dx·(0.67·dy) - dy·0         = +0.67·dx·dy
 *   P2 cross = dx·(1.2·dy)  - dy·(0.33·dx) = +0.87·dx·dy  → same sign ✓
 */
const CORNER_P1_Y_RATIO = 1.2;
const CORNER_P2_X_RATIO = 1 + MORPH_OVERSHOOT;
const CORNER_P2_Y_RATIO = 1.0;

const CORNER_POSITIONS: ReadonlySet<FloatingButtonPosition> = new Set([
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
]);

export function isCorner(position: FloatingButtonPosition): boolean {
  return CORNER_POSITIONS.has(position);
}

/**
 * Standard cubic Bezier evaluation in 2D.
 *
 *   B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
 */
export function cubicBezier(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
): Point {
  const u = 1 - t;
  const b0 = u * u * u;
  const b1 = 3 * u * u * t;
  const b2 = 3 * u * t * t;
  const b3 = t * t * t;
  return {
    x: b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
    y: b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y,
  };
}

/**
 * Build the four control points for the morph trajectory.
 *
 * Convention: DOM coordinates, so positive Y is downward. `dx` and `dy` are
 * already signed (target center minus container center).
 *
 * - **Corner** position: a bow-shaped arc (no S-curve). P1 and P2 are both
 *   placed on the same side of the straight line P0→P3, guaranteeing a
 *   single clean arc. The path sweeps toward the horizontal axis first
 *   then plunges to the target, with an overshoot on X.
 * - **Mid-edge** position (top/bottom-center, middle-right): the curve is
 *   degenerate into a straight line by placing P1 and P2 on the segment
 *   P0-P3, with overshoot on the dominant axis.
 */
export function getMorphControlPoints(
  position: FloatingButtonPosition,
  dx: number,
  dy: number,
): MorphControlPoints {
  if (isCorner(position)) {
    return cornerControlPoints(dx, dy);
  }
  return straightControlPoints(dx, dy);
}

function cornerControlPoints(dx: number, dy: number): MorphControlPoints {
  return {
    p0: { x: 0, y: 0 },
    p1: { x: 0, y: dy * CORNER_P1_Y_RATIO },
    p2: { x: dx * CORNER_P2_X_RATIO, y: dy * CORNER_P2_Y_RATIO },
    p3: { x: dx, y: dy },
  };
}

function straightControlPoints(dx: number, dy: number): MorphControlPoints {
  const overshootX = Math.abs(dx) >= Math.abs(dy) ? dx * MORPH_OVERSHOOT : 0;
  const overshootY = Math.abs(dy) > Math.abs(dx) ? dy * MORPH_OVERSHOOT : 0;
  return {
    p0: { x: 0, y: 0 },
    p1: { x: dx * STRAIGHT_P1_RATIO, y: dy * STRAIGHT_P1_RATIO },
    p2: { x: dx + overshootX, y: dy + overshootY },
    p3: { x: dx, y: dy },
  };
}
