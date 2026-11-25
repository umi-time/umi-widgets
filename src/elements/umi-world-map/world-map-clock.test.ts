import { describe, expect, it } from "vitest";
import {
  createGeometry,
  computeDialRotation,
  computeSunIndicatorAngle,
  computeUmiDialAngle,
} from "./world-map-clock";

describe("createGeometry", () => {
  it("matches original 180px clock geometry", () => {
    const geometry = createGeometry(180, 180);

    expect(geometry.radius).toBeCloseTo(180 * (80 / 180));

    expect(geometry.solarRadius).toBeCloseTo(
      geometry.radius +
        geometry.radius * (1 / 85) +
        Math.max(4, geometry.radius * 0.08) / 2,
    );

    expect(geometry.triangleHeight).toBeCloseTo(geometry.radius * (62 / 85));
    expect(geometry.triangleHalfWidth).toBeCloseTo(geometry.radius * (9 / 85));
    expect(geometry.hubRadius).toBeCloseTo(geometry.radius * (8 / 85));
    expect(geometry.hubInnerRadius).toBeCloseTo(geometry.radius * (3 / 85));
  });

  it("scales linearly", () => {
    const small = createGeometry(180, 180);
    const large = createGeometry(360, 360);

    expect(large.radius).toBeCloseTo(small.radius * 2);
    expect(large.triangleHeight).toBeCloseTo(small.triangleHeight * 2);
    expect(large.hubRadius).toBeCloseTo(small.hubRadius * 2);
  });

  it("uses the smaller dimension", () => {
    const geometry = createGeometry(360, 180);

    expect(geometry.radius).toBeCloseTo(80);
    expect(geometry.cx).toBe(180);
    expect(geometry.cy).toBe(90);
  });

  it("supports rectangular canvases", () => {
    const geometry = createGeometry(180, 360);

    expect(geometry.radius).toBeCloseTo(80);
    expect(geometry.cx).toBe(90);
    expect(geometry.cy).toBe(180);
    expect(geometry.fontSize).toBeCloseTo(22.58823);
  });

  it("produces positive geometry values", () => {
    const geometry = createGeometry(180, 180);

    expect(geometry.radius).toBeGreaterThan(0);
    expect(geometry.solarRadius).toBeGreaterThan(0);
    expect(geometry.solarRingWidth).toBeGreaterThan(0);
    expect(geometry.fontSize).toBeGreaterThan(0);
    expect(geometry.labelOffset).toBeGreaterThan(0);
  });
});

describe("computeDialRotation", () => {
  it("rotates the dial so noon is at local solar north", () => {
    expect(computeDialRotation(0)).toBe(180);
    expect(computeDialRotation(180)).toBe(360);
    expect(computeDialRotation(-180)).toBe(0);
    expect(computeDialRotation(90)).toBe(270);
    expect(computeDialRotation(-90)).toBe(90);
  });

  it("offsets longitude by 180 degrees", () => {
    expect(computeDialRotation(42)).toBe(222);
  });
});

describe("computeSunIndicatorAngle", () => {
  it("returns null for missing events", () => {
    expect(computeSunIndicatorAngle(null, 0)).toBeNull();
  });

  it("converts umi position to dial position", () => {
    expect(computeSunIndicatorAngle(90, 0)).toBe(270);
  });

  it("includes longitude", () => {
    expect(computeSunIndicatorAngle(90, 30)).toBe(300);
  });

  it("supports western longitudes", () => {
    expect(computeSunIndicatorAngle(90, -30)).toBe(240);
  });
});

describe("computeUmiDialAngle", () => {
  it("always returns a valid angle", () => {
    const angle = computeUmiDialAngle(
      35.6764,
      139.65,
      new Date("2026-06-21T12:00:00Z"),
    );

    expect(angle).toBeGreaterThanOrEqual(0);
    expect(angle).toBeLessThan(360);
  });

  it("never returns NaN", () => {
    const angle = computeUmiDialAngle(0, 0, new Date());

    expect(Number.isNaN(angle)).toBe(false);
  });

  it("returns a stable result for identical inputs", () => {
    const date = new Date("2026-06-21T12:00:00Z");
    const first = computeUmiDialAngle(35.6764, 139.65, date);
    const second = computeUmiDialAngle(35.6764, 139.65, date);

    expect(first).toBeCloseTo(second, 10);
  });
});
