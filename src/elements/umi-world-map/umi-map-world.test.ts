import { describe, expect, it } from "vitest";

import "./index";

describe("UmiWorldMapElement", () => {
  it("registers as a custom element", () => {
    expect(customElements.get("umi-world-map")).toBeDefined();
  });

  it("creates the correct element type", () => {
    const map = document.createElement("umi-world-map");

    expect(map.constructor.name).toBe("UmiWorldMapElement");
  });

  it("starts with no locations", () => {
    const map = document.createElement("umi-world-map");

    expect(map.locations).toHaveLength(0);
  });

  it("finds child locations", () => {
    const map = document.createElement("umi-world-map");

    const location = document.createElement("umi-location");

    map.append(location);

    expect(map.locations).toHaveLength(1);
    expect(map.locations[0]).toBe(location);
  });

  it("adds locations", () => {
    const map = document.createElement("umi-world-map");

    const location = map.addLocation("Tokyo", 35.6764, 139.65);

    expect(map.locations).toHaveLength(1);
    expect(map.locations[0]).toBe(location);
  });

  it("stores location properties", () => {
    const map = document.createElement("umi-world-map");

    const location = map.addLocation("Tokyo", 35.6764, 139.65);

    expect(location.label).toBe("Tokyo");
    expect(location.latitude).toBeCloseTo(35.6764);
    expect(location.longitude).toBeCloseTo(139.65);
  });

  it("returns overlay layers", () => {
    const map = document.createElement("umi-world-map");

    expect(map.getMapOverlayLayer()).toBeInstanceOf(SVGGElement);
    expect(map.getGridOverlayLayer()).toBeInstanceOf(SVGGElement);
    expect(map.getTerminatorOverlayLayer()).toBeInstanceOf(SVGGElement);
    expect(map.getClockOverlayLayer()).toBeInstanceOf(SVGGElement);
  });

  it("returns distinct overlay layers", () => {
    const map = document.createElement("umi-world-map");

    expect(map.getMapOverlayLayer()).not.toBe(map.getGridOverlayLayer());
    expect(map.getGridOverlayLayer()).not.toBe(map.getTerminatorOverlayLayer());
    expect(map.getTerminatorOverlayLayer()).not.toBe(
      map.getClockOverlayLayer(),
    );
  });
});
