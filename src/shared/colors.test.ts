import { describe, expect, it } from "vitest";

import {
  buildSolarConicGradient,
  buildSolarLinearGradient,
  lerpColor,
  parseHexColor,
  solarElevationToColor,
} from "./colors";

describe("parseHexColor", () => {
  it("parses black", () => {
    expect(parseHexColor("#000000")).toEqual([0, 0, 0]);
  });

  it("parses white", () => {
    expect(parseHexColor("#ffffff")).toEqual([255, 255, 255]);
  });

  it("parses arbitrary colors", () => {
    expect(parseHexColor("#123456")).toEqual([18, 52, 86]);
  });

  it("throws for invalid hex colors", () => {
    expect(() => parseHexColor("red")).toThrow();
  });
});

describe("lerpColor", () => {
  it("returns first color when t is 0", () => {
    expect(lerpColor("#000000", "#ffffff", 0)).toBe("#000000");
  });

  it("returns second color when t is 1", () => {
    expect(lerpColor("#000000", "#ffffff", 1)).toBe("#ffffff");
  });

  it("interpolates halfway between colors", () => {
    expect(lerpColor("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
});

describe("solarElevationToColor", () => {
  it("returns daylight color at or above 6 degrees", () => {
    expect(solarElevationToColor(6)).toBe("#7EC8FF");
    expect(solarElevationToColor(45)).toBe("#7EC8FF");
  });

  it("returns a transition color between 0 and 6 degrees", () => {
    const color = solarElevationToColor(3);

    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(color).not.toBe("#7EC8FF");
  });

  it("returns a transition color between -6 and 0 degrees", () => {
    const color = solarElevationToColor(-3);

    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("returns a transition color between -18 and -6 degrees", () => {
    const color = solarElevationToColor(-12);

    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("returns night color below -18 degrees", () => {
    expect(solarElevationToColor(-19)).toBe("#001F3F");
  });
});

describe("buildSolarConicGradient", () => {
  it("returns a CSS conic-gradient", () => {
    const gradient = buildSolarConicGradient(0, 0, 0);

    expect(gradient.startsWith("conic-gradient(")).toBe(true);
  });

  it("contains 60 color stops", () => {
    const gradient = buildSolarConicGradient(0, 0, 0);

    expect((gradient.match(/deg/g) ?? []).length).toBe(60);
  });
});

describe("buildSolarLinearGradient", () => {
  it("returns a CSS linear-gradient", () => {
    const gradient = buildSolarLinearGradient(0, 0, 0, 0);

    expect(gradient.startsWith("linear-gradient(")).toBe(true);
  });

  it("contains 61 percentage stops", () => {
    const gradient = buildSolarLinearGradient(0, 0, 0, 0);

    expect((gradient.match(/%/g) ?? []).length).toBe(61);
  });
});
