import { describe, expect, it } from "vitest";

import {
  buildLatitudeLines,
  buildLongitudeLines,
} from "./world-map-grid";

const WIDTH = 1652.4702;
const HEIGHT = 1220.6385;

describe("buildLatitudeLines", () => {
  it("creates horizontal lines", () => {
    const lines = buildLatitudeLines(
      WIDTH,
      HEIGHT,
    );

    for (const line of lines) {
      expect(line.y1).toBeCloseTo(
        line.y2,
        6,
      );
    }
  });

  it("includes the equator", () => {
    const lines = buildLatitudeLines(
      WIDTH,
      HEIGHT,
    );

    expect(
      lines.some(
        (line) => line.value === 0,
      ),
    ).toBe(true);
  });

  it("labels the equator as 0°", () => {
    const lines = buildLatitudeLines(
      WIDTH,
      HEIGHT,
    );

    const equator = lines.find(
      (line) => line.value === 0,
    );

    expect(equator?.label).toBe("0°");
  });

  it("labels northern latitudes with N", () => {
    const lines = buildLatitudeLines(
      WIDTH,
      HEIGHT,
    );

    const line = lines.find(
      (entry) => entry.value === 15,
    );

    expect(line?.label).toBe("15°N");
  });

  it("labels southern latitudes with S", () => {
    const lines = buildLatitudeLines(
      WIDTH,
      HEIGHT,
    );

    const line = lines.find(
      (entry) => entry.value === -15,
    );

    expect(line?.label).toBe("15°S");
  });

  it("marks the equator as a major line", () => {
    const lines = buildLatitudeLines(
      WIDTH,
      HEIGHT,
    );

    const equator = lines.find(
      (line) => line.value === 0,
    );

    expect(equator?.isMajor).toBe(true);
  });

  it("does not mark other latitude lines as major", () => {
    const lines = buildLatitudeLines(
      WIDTH,
      HEIGHT,
    );

    const line = lines.find(
      (entry) => entry.value === 15,
    );

    expect(line?.isMajor).toBe(false);
  });
});

describe("buildLongitudeLines", () => {
  it("creates vertical lines", () => {
    const lines = buildLongitudeLines(
      WIDTH,
      HEIGHT,
    );

    for (const line of lines) {
      expect(line.x1).toBeCloseTo(
        line.x2,
        6,
      );
    }
  });

  it("includes the prime meridian", () => {
    const lines = buildLongitudeLines(
      WIDTH,
      HEIGHT,
    );

    expect(
      lines.some(
        (line) => line.value === 0,
      ),
    ).toBe(true);
  });

  it("labels the prime meridian as 0°", () => {
    const lines = buildLongitudeLines(
      WIDTH,
      HEIGHT,
    );

    const meridian = lines.find(
      (line) => line.value === 0,
    );

    expect(meridian?.label).toBe("0°");
  });

  it("labels eastern longitudes with E", () => {
    const lines = buildLongitudeLines(
      WIDTH,
      HEIGHT,
    );

    const line = lines.find(
      (entry) => entry.value === 15,
    );

    expect(line?.label).toBe("15°E");
  });

  it("labels western longitudes with W", () => {
    const lines = buildLongitudeLines(
      WIDTH,
      HEIGHT,
    );

    const line = lines.find(
      (entry) => entry.value === -15,
    );

    expect(line?.label).toBe("15°W");
  });

  it("marks the prime meridian as a major line", () => {
    const lines = buildLongitudeLines(
      WIDTH,
      HEIGHT,
    );

    const meridian = lines.find(
      (line) => line.value === 0,
    );

    expect(meridian?.isMajor).toBe(true);
  });

  it("does not mark other longitude lines as major", () => {
    const lines = buildLongitudeLines(
      WIDTH,
      HEIGHT,
    );

    const line = lines.find(
      (entry) => entry.value === 15,
    );

    expect(line?.isMajor).toBe(false);
  });
});