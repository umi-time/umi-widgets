import { describe, expect, it } from "vitest";

import {
  clampLatitude,
  clampLongitude,
  MAX_LATITUDE,
  MAX_LONGITUDE,
  MIN_LATITUDE,
  MIN_LONGITUDE,
} from "./coordinates";

describe("clampLatitude", () => {
  it("returns values already within range", () => {
    expect(clampLatitude(0)).toBe(0);
    expect(clampLatitude(45)).toBe(45);
    expect(clampLatitude(-45)).toBe(-45);
  });

  it("clamps values below the minimum latitude", () => {
    expect(clampLatitude(-100)).toBe(MIN_LATITUDE);
  });

  it("clamps values above the maximum latitude", () => {
    expect(clampLatitude(100)).toBe(MAX_LATITUDE);
  });

  it("returns null for non-finite values", () => {
    expect(clampLatitude(NaN)).toBeNull();
    expect(clampLatitude(Infinity)).toBeNull();
    expect(clampLatitude(-Infinity)).toBeNull();
  });
});

describe("clampLongitude", () => {
  it("returns values already within range", () => {
    expect(clampLongitude(0)).toBe(0);
    expect(clampLongitude(90)).toBe(90);
    expect(clampLongitude(-90)).toBe(-90);
  });

  it("clamps values below the minimum longitude", () => {
    expect(clampLongitude(-200)).toBe(MIN_LONGITUDE);
  });

  it("clamps values above the maximum longitude", () => {
    expect(clampLongitude(200)).toBe(MAX_LONGITUDE);
  });

  it("returns null for non-finite values", () => {
    expect(clampLongitude(NaN)).toBeNull();
    expect(clampLongitude(Infinity)).toBeNull();
    expect(clampLongitude(-Infinity)).toBeNull();
  });
});