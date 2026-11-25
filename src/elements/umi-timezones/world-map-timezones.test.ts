import { beforeEach, describe, expect, it, vi } from "vitest";

describe("world-map-timezones", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  describe("ringToPath", () => {
    it("creates SVG path commands", async () => {
      const { ringToPath } = await import("./world-map-timezones");

      const d = ringToPath(
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
        ],
        1652.4702,
        1220.6385,
      );

      expect(d.startsWith("M")).toBe(true);
      expect(d.endsWith("Z")).toBe(true);
    });

    it("clamps polar latitudes", async () => {
      const { ringToPath } = await import("./world-map-timezones");

      const d = ringToPath(
        [
          [0, -90],
          [10, 90],
        ],
        1652.4702,
        1220.6385,
      );

      expect(d.includes("Infinity")).toBe(false);
      expect(d.includes("NaN")).toBe(false);
    });
  });

  describe("polygonToPath", () => {
    it("creates a path from a polygon", async () => {
      const { polygonToPath } = await import("./world-map-timezones");

      const d = polygonToPath(
        [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
          ],
        ],
        1652.4702,
        1220.6385,
      );

      expect(d.startsWith("M")).toBe(true);
      expect(d.endsWith("Z")).toBe(true);
    });
  });

  describe("loadTimeZones", () => {
    it("loads timezone data", async () => {
      const { loadTimeZones } = await import("./world-map-timezones");

      const geoJson = {
        features: [],
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => geoJson,
        }),
      );

      const result = await loadTimeZones("/zones.json");

      expect(result).toEqual(geoJson);
    });

    it("caches timezone data after first load", async () => {
      const { loadTimeZones } = await import("./world-map-timezones");

      let fetchCount = 0;

      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () => {
          fetchCount += 1;

          return {
            ok: true,
            json: async () => ({
              features: [],
            }),
          };
        }),
      );

      await loadTimeZones("/zones.json");
      await loadTimeZones("/zones.json");

      expect(fetchCount).toBe(1);
    });

    it("throws when fetch fails", async () => {
      const { loadTimeZones } = await import("./world-map-timezones");

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
        }),
      );

      await expect(
        loadTimeZones("/missing.json"),
      ).rejects.toThrow(
        "Failed to load timezone data: 404",
      );
    });
  });

  describe("buildTimezonePaths", () => {
    it("builds paths from Polygon features", async () => {
      const { buildTimezonePaths } = await import(
        "./world-map-timezones"
      );

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            features: [
              {
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [0, 0],
                      [10, 0],
                      [10, 10],
                      [0, 10],
                    ],
                  ],
                },
              },
            ],
          }),
        }),
      );

      const paths = await buildTimezonePaths(
        1652.4702,
        1220.6385,
        "/zones.json",
      );

      expect(paths).toHaveLength(1);
      expect(paths[0]?.startsWith("M")).toBe(true);
    });

    it("builds paths from MultiPolygon features", async () => {
      const { buildTimezonePaths } = await import(
        "./world-map-timezones"
      );

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            features: [
              {
                geometry: {
                  type: "MultiPolygon",
                  coordinates: [
                    [
                      [
                        [0, 0],
                        [10, 0],
                        [10, 10],
                        [0, 10],
                      ],
                    ],
                    [
                      [
                        [20, 20],
                        [30, 20],
                        [30, 30],
                        [20, 30],
                      ],
                    ],
                  ],
                },
              },
            ],
          }),
        }),
      );

      const paths = await buildTimezonePaths(
        1652.4702,
        1220.6385,
        "/zones.json",
      );

      expect(paths).toHaveLength(2);
    });

    it("ignores features without geometry", async () => {
      const { buildTimezonePaths } = await import(
        "./world-map-timezones"
      );

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            features: [
              {
                geometry: null,
              },
            ],
          }),
        }),
      );

      const paths = await buildTimezonePaths(
        1652.4702,
        1220.6385,
        "/zones.json",
      );

      expect(paths).toEqual([]);
    });
  });
});