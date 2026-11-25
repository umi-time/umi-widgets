import { describe, expect, it } from "vitest";
import {
  mercatorProject,
  mercatorInverse,
  MAP_MIN_LATITUDE,
  MAP_MAX_LATITUDE,
  MAP_MIN_LONGITUDE,
  MAP_MAX_LONGITUDE,
} from "./world-map-projection";

describe("extended longitude support", () => {
  const width = 1000;
  const height = 500;

  it("preserves longitudes east of 180°", () => {
    const projected = mercatorProject(60, 189, width, height);
    const restored = mercatorInverse(projected.x, projected.y, width, height);

    expect(restored.longitude).toBeCloseTo(189, 3);
  });

  it("preserves longitudes west of -180°", () => {
    const projected = mercatorProject(60, -185, width, height);
    const restored = mercatorInverse(projected.x, projected.y, width, height);

    expect(restored.longitude).toBeCloseTo(-185, 3);
  });

  it("supports the minimum map longitude", () => {
    const projected = mercatorProject(0, MAP_MIN_LONGITUDE, width, height);
    const restored = mercatorInverse(projected.x, projected.y, width, height);

    expect(restored.longitude).toBeCloseTo(MAP_MIN_LONGITUDE, 3);
  });

  it("supports the maximum map longitude", () => {
    const projected = mercatorProject(0, MAP_MAX_LONGITUDE, width, height);
    const restored = mercatorInverse(projected.x, projected.y, width, height);

    expect(restored.longitude).toBeCloseTo(MAP_MAX_LONGITUDE, 3);
  });

  it("keeps Alaska overflow distinct from canonical longitude", () => {
    const projected = mercatorProject(65, 190, width, height);
    const restored = mercatorInverse(projected.x, projected.y, width, height);

    expect(restored.longitude).toBeGreaterThan(180);
    expect(restored.longitude).toBeCloseTo(190, 3);
  });

  it("keeps Russia overflow distinct from canonical longitude", () => {
    const projected = mercatorProject(65, -186, width, height);
    const restored = mercatorInverse(projected.x, projected.y, width, height);

    expect(restored.longitude).toBeLessThan(-180);
    expect(restored.longitude).toBeCloseTo(-186, 3);
  });

  it("preserves duplicated edge regions used by the map artwork", () => {
    const east = mercatorProject(62, 188, width, height);
    const west = mercatorProject(62, -181, width, height);

    expect(east.x).toBeGreaterThan(west.x);
  });
});

describe("world-map projection", () => {
  const width = 1000;
  const height = 500;

  describe("latitude bounds", () => {
    it("supports maximum map latitude", () => {
      const projected = mercatorProject(MAP_MAX_LATITUDE, 0, width, height);
      expect(projected.y).toBeCloseTo(0, 3);

      const restored = mercatorInverse(projected.x, projected.y, width, height);
      expect(restored.latitude).toBeCloseTo(MAP_MAX_LATITUDE, 3);
    });

    it("supports minimum map latitude", () => {
      const projected = mercatorProject(MAP_MIN_LATITUDE, 0, width, height);
      expect(projected.y).toBeCloseTo(height, 3);

      const restored = mercatorInverse(projected.x, projected.y, width, height);
      expect(restored.latitude).toBeCloseTo(MAP_MIN_LATITUDE, 3);
    });
  });

  describe("round-trip accuracy", () => {
    it.each([
      [0, 0],
      [35.6764, 139.65], // Tokyo
      [51.5072, -0.1276], // London
      [35.14, -120.64], // Pismo Beach
      [-33.8688, 151.2093], // Sydney
      [64.1265, -21.8174], // Reykjavik
    ])("round-trips lat=%f lon=%f", (latitude, longitude) => {
      const projected = mercatorProject(latitude, longitude, width, height);
      const restored = mercatorInverse(projected.x, projected.y, width, height);

      expect(restored.latitude).toBeCloseTo(latitude, 4);
      expect(restored.longitude).toBeCloseTo(longitude, 4);
    });
  });

  it("places 0° latitude and 0° longitude near the visual center", () => {
    const projected = mercatorProject(0, 0, width, height);
    const restored = mercatorInverse(projected.x, projected.y, width, height);

    expect(restored.latitude).toBeCloseTo(0, 4);
    expect(restored.longitude).toBeCloseTo(0, 4);
  });

  it("round-trips all map corners", () => {
    const corners = [
      [MAP_MAX_LATITUDE, MAP_MIN_LONGITUDE],
      [MAP_MAX_LATITUDE, MAP_MAX_LONGITUDE],
      [MAP_MIN_LATITUDE, MAP_MIN_LONGITUDE],
      [MAP_MIN_LATITUDE, MAP_MAX_LONGITUDE],
    ];

    for (const [lat, lon] of corners) {
      const projected = mercatorProject(lat!, lon!, width, height);
      const restored = mercatorInverse(projected.x, projected.y, width, height);

      expect(restored.latitude).toBeCloseTo(lat!, 3);
      expect(restored.longitude).toBeCloseTo(lon!, 3);
    }
  });
});
