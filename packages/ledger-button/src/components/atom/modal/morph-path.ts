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
export const MORPH_OVERSHOOT = 0.1;

/**
 * Where on the segment P1 sits when the curve is degenerate (straight line).
 * Kept at one third for an even visual cadence between P0 - P1 - P2 - P3.
 */
const STRAIGHT_P1_RATIO = 1 / 3;

/**
 * For corner trajectories, how early the curve "drops" along the axis of departure.
 * 0.6 = P1 is 60% of the way down at the start, giving a steep initial descent.
 */
const CORNER_P1_DROP_RATIO = 0.6;

/**
 * For corner trajectories, P2 is placed past P3 on the X axis to produce
 * the overshoot. Value above 1 means "go beyond the target then settle back".
 */
const CORNER_P2_X_RATIO = 1 + MORPH_OVERSHOOT;

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
 * - **Corner** position: an "L"-shaped Bezier that starts vertically (P1 on
 *   the X=0 axis) and ends horizontally (P2 sharing P3's Y). Overshoot is
 *   applied on the horizontal axis.
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
    p1: { x: 0, y: dy * CORNER_P1_DROP_RATIO },
    p2: { x: dx * CORNER_P2_X_RATIO, y: dy },
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
