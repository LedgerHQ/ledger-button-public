import { describe, expect, test } from "vitest";

import type { FloatingButtonPosition } from "../floating-button/ledger-floating-button";
import {
  cubicBezier,
  getMorphControlPoints,
  isCorner,
  MORPH_OVERSHOOT,
  type Point,
} from "./morph-path";

const EPSILON = 1e-9;

function expectPointClose(actual: Point, expected: Point): void {
  expect(actual.x).toBeCloseTo(expected.x, 9);
  expect(actual.y).toBeCloseTo(expected.y, 9);
}

describe("cubicBezier", () => {
  const p0: Point = { x: 0, y: 0 };
  const p1: Point = { x: 1, y: 2 };
  const p2: Point = { x: 3, y: 4 };
  const p3: Point = { x: 5, y: 6 };

  test("returns P0 at t = 0", () => {
    expectPointClose(cubicBezier(0, p0, p1, p2, p3), p0);
  });

  test("returns P3 at t = 1", () => {
    expectPointClose(cubicBezier(1, p0, p1, p2, p3), p3);
  });

  test("traces the segment when all points are colinear and evenly spaced", () => {
    const a: Point = { x: 0, y: 0 };
    const b: Point = { x: 1, y: 1 };
    const c: Point = { x: 2, y: 2 };
    const d: Point = { x: 3, y: 3 };
    const mid = cubicBezier(0.5, a, b, c, d);
    expectPointClose(mid, { x: 1.5, y: 1.5 });
  });

  test("matches the analytic value at t = 0.5", () => {
    const t = 0.5;
    const expected = {
      x:
        Math.pow(1 - t, 3) * p0.x +
        3 * Math.pow(1 - t, 2) * t * p1.x +
        3 * (1 - t) * Math.pow(t, 2) * p2.x +
        Math.pow(t, 3) * p3.x,
      y:
        Math.pow(1 - t, 3) * p0.y +
        3 * Math.pow(1 - t, 2) * t * p1.y +
        3 * (1 - t) * Math.pow(t, 2) * p2.y +
        Math.pow(t, 3) * p3.y,
    };
    expectPointClose(cubicBezier(t, p0, p1, p2, p3), expected);
  });
});

describe("isCorner", () => {
  test.each<FloatingButtonPosition>([
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ])("returns true for corner %s", (pos) => {
    expect(isCorner(pos)).toBe(true);
  });

  test.each<FloatingButtonPosition>([
    "top-center",
    "bottom-center",
    "middle-right",
  ])("returns false for mid-edge %s", (pos) => {
    expect(isCorner(pos)).toBe(false);
  });
});

describe("getMorphControlPoints - corners", () => {
  const dx = 200;
  const dy = 300;

  test.each<FloatingButtonPosition>([
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ])("%s: P0 is origin and P3 is the target", (position) => {
    const { p0, p3 } = getMorphControlPoints(position, dx, dy);
    expectPointClose(p0, { x: 0, y: 0 });
    expectPointClose(p3, { x: dx, y: dy });
  });

  test("P1 is on the vertical axis of departure (x = 0)", () => {
    const { p1 } = getMorphControlPoints("bottom-right", dx, dy);
    expect(p1.x).toBe(0);
  });

  test("P2 shares P3's Y so the arrival tangent is horizontal", () => {
    const { p2, p3 } = getMorphControlPoints("bottom-right", dx, dy);
    expect(p2.y).toBe(p3.y);
  });

  test("P2 overshoots past P3 on the X axis", () => {
    const { p2 } = getMorphControlPoints("bottom-right", dx, dy);
    expect(p2.x).toBeGreaterThan(dx);
    expect(p2.x).toBeCloseTo(dx * (1 + MORPH_OVERSHOOT), 9);
  });

  test("overshoot direction follows the sign of dx (negative dx)", () => {
    const { p2 } = getMorphControlPoints("bottom-left", -dx, dy);
    expect(p2.x).toBeLessThan(-dx);
    expect(p2.x).toBeCloseTo(-dx * (1 + MORPH_OVERSHOOT), 9);
  });
});

describe("getMorphControlPoints - mid-edges (straight line)", () => {
  test("bottom-center: all points have x = 0 (pure vertical)", () => {
    const { p0, p1, p2, p3 } = getMorphControlPoints("bottom-center", 0, 400);
    expect(p0.x).toBe(0);
    expect(p1.x).toBe(0);
    expect(p2.x).toBe(0);
    expect(p3.x).toBe(0);
  });

  test("bottom-center: overshoots past dy on the Y axis", () => {
    const dy = 400;
    const { p2, p3 } = getMorphControlPoints("bottom-center", 0, dy);
    expect(p3.y).toBe(dy);
    expect(p2.y).toBeGreaterThan(dy);
    expect(p2.y).toBeCloseTo(dy * (1 + MORPH_OVERSHOOT), 9);
  });

  test("middle-right: all points have y = 0 (pure horizontal)", () => {
    const { p0, p1, p2, p3 } = getMorphControlPoints("middle-right", 400, 0);
    expect(p0.y).toBe(0);
    expect(p1.y).toBe(0);
    expect(p2.y).toBe(0);
    expect(p3.y).toBe(0);
  });

  test("middle-right: overshoots past dx on the X axis", () => {
    const dx = 400;
    const { p2, p3 } = getMorphControlPoints("middle-right", dx, 0);
    expect(p3.x).toBe(dx);
    expect(p2.x).toBeGreaterThan(dx);
    expect(p2.x).toBeCloseTo(dx * (1 + MORPH_OVERSHOOT), 9);
  });

  test("trajectory is a straight line: every sampled point lies on the segment", () => {
    const dx = 0;
    const dy = 400;
    const points = getMorphControlPoints("bottom-center", dx, dy);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const { x } = cubicBezier(t, points.p0, points.p1, points.p2, points.p3);
      expect(Math.abs(x)).toBeLessThan(EPSILON);
    }
  });
});

describe("getMorphControlPoints - sampled trajectory", () => {
  test("bottom-right: starts at origin and ends at the target", () => {
    const dx = 200;
    const dy = 300;
    const points = getMorphControlPoints("bottom-right", dx, dy);
    expectPointClose(
      cubicBezier(0, points.p0, points.p1, points.p2, points.p3),
      { x: 0, y: 0 },
    );
    expectPointClose(
      cubicBezier(1, points.p0, points.p1, points.p2, points.p3),
      { x: dx, y: dy },
    );
  });

  test("bottom-right: trajectory exceeds dx in X at some point (overshoot proof)", () => {
    const dx = 200;
    const dy = 300;
    const points = getMorphControlPoints("bottom-right", dx, dy);
    let maxX = 0;
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const { x } = cubicBezier(t, points.p0, points.p1, points.p2, points.p3);
      if (x > maxX) maxX = x;
    }
    expect(maxX).toBeGreaterThan(dx);
  });
});
