// src/elements/umi-world-map/world-map-terminator.test.ts

import { describe, expect, it } from "vitest";

import { computeTerminator } from "./world-map-terminator";

const VIEWBOX_WIDTH = 1652.4702;
const VIEWBOX_HEIGHT = 1220.6385;

describe("computeTerminator", () => {
  it("returns many points", () => {
    const result = computeTerminator(
      new Date("2026-03-20T12:00:00Z"),
      VIEWBOX_WIDTH,
      VIEWBOX_HEIGHT,
    );

    expect(result.points.length).toBeGreaterThan(300);
  });

  it("returns finite coordinates", () => {
    const result = computeTerminator(
      new Date("2026-06-21T12:00:00Z"),
      VIEWBOX_WIDTH,
      VIEWBOX_HEIGHT,
    );

    for (const point of result.points) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
    }
  });

  it("stays within the viewport", () => {
    const result = computeTerminator(
      new Date("2026-06-21T12:00:00Z"),
      VIEWBOX_WIDTH,
      VIEWBOX_HEIGHT,
    );

    for (const point of result.points) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(VIEWBOX_WIDTH);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(VIEWBOX_HEIGHT);
    }
  });

  it("sets borderOnTop for southern declinations", () => {
    const result = computeTerminator(
      new Date("2026-12-21T12:00:00Z"),
      VIEWBOX_WIDTH,
      VIEWBOX_HEIGHT,
    );

    expect(result.borderOnTop).toBe(true);
  });

  it("sets borderOnTop false for northern declinations", () => {
    const result = computeTerminator(
      new Date("2026-06-21T12:00:00Z"),
      VIEWBOX_WIDTH,
      VIEWBOX_HEIGHT,
    );

    expect(result.borderOnTop).toBe(false);
  });

  it("scales horizontally with viewport width", () => {
    const small = computeTerminator(
      new Date("2026-06-21T12:00:00Z"),
      1000,
      500,
    );

    const large = computeTerminator(
      new Date("2026-06-21T12:00:00Z"),
      2000,
      500,
    );

    expect(large.points[0]?.x).toBeCloseTo((small.points[0]?.x ?? 0) * 2, 3);
  });
});
