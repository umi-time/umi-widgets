import defaultTimezoneData from "./assets/timezones.json"; // Adjust relative path to your JSON
import {
  mercatorProject,
  MAP_MIN_LATITUDE,
  MAP_MAX_LATITUDE,
} from "../umi-world-map";

/**
 * GeoJSON feature collection containing timezone boundary geometries.
 */
export interface GeoJsonFeatureCollection {
  features: GeoJsonFeature[];
}

/**
 * GeoJSON feature containing a timezone boundary geometry.
 */
export interface GeoJsonFeature {
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

// Cache fetched datasets by URL
const urlCache = new Map<string, GeoJsonFeatureCollection>();
const inflightRequests = new Map<string, Promise<GeoJsonFeatureCollection>>();

/**
 * Loads timezone boundary data from a GeoJSON source.
 *
 * When no URL is provided, the bundled timezone dataset is returned.
 * Results are cached to avoid redundant network requests.
 *
 * @param url Optional URL of a GeoJSON timezone dataset.
 * @returns A GeoJSON feature collection containing timezone boundaries.
 */
export async function loadTimeZones(
  url?: string,
): Promise<GeoJsonFeatureCollection> {
  // 1. Fall back to the bundled GeoJSON if no URL is provided
  if (!url) {
    return defaultTimezoneData as GeoJsonFeatureCollection;
  }

  // 2. Return cached external data if already fetched
  const cached = urlCache.get(url);
  if (cached) {
    return cached;
  }

  // 3. Deduplicate concurrent fetches for the same URL
  let request = inflightRequests.get(url);
  if (!request) {
    request = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load timezone data: ${response.status}`);
        }
        return response.json() as Promise<GeoJsonFeatureCollection>;
      })
      .then((geo) => {
        urlCache.set(url, geo);
        return geo;
      })
      .finally(() => {
        inflightRequests.delete(url);
      });

    inflightRequests.set(url, request);
  }

  return request;
}

function clampMapLatitude(latitude: number): number {
  return Math.max(MAP_MIN_LATITUDE, Math.min(MAP_MAX_LATITUDE, latitude));
}

/**
 * Converts a GeoJSON linear ring into an SVG path string using the
 * world map's Mercator projection.
 *
 * @param ring Array of [longitude, latitude] coordinate pairs.
 * @param width Width of the target map in pixels.
 * @param height Height of the target map in pixels.
 * @returns SVG path data representing the projected ring.
 */
export function ringToPath(
  ring: number[][],
  width: number,
  height: number,
): string {
  const commands: string[] = [];

  ring.forEach(([longitude, latitude], index) => {
    const point = mercatorProject(
      clampMapLatitude(latitude!),
      longitude!,
      width,
      height,
    );

    commands.push(
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    );
  });

  commands.push("Z");

  return commands.join(" ");
}

/**
 * Converts a GeoJSON polygon into an SVG path string using the world map's
 * Mercator projection.
 *
 * Each ring in the polygon is projected and combined into a single SVG
 * path suitable for rendering on the map.
 *
 * @param polygon GeoJSON polygon coordinates.
 * @param width Width of the target map in pixels.
 * @param height Height of the target map in pixels.
 * @returns SVG path data representing the projected polygon.
 */
export function polygonToPath(
  polygon: number[][][],
  width: number,
  height: number,
): string {
  return polygon.map((ring) => ringToPath(ring, width, height)).join(" ");
}

export async function buildTimezonePaths(
  width: number,
  height: number,
  source?: string | GeoJsonFeatureCollection,
): Promise<string[]> {
  const geo =
    typeof source === "object" && source !== null
      ? source
      : await loadTimeZones(source);

  const paths: string[] = [];

  for (const feature of geo.features) {
    const geometry = feature.geometry;
    if (!geometry) continue;

    switch (geometry.type) {
      case "Polygon": {
        paths.push(
          polygonToPath(geometry.coordinates as number[][][], width, height),
        );
        break;
      }
      case "MultiPolygon": {
        const polygons = geometry.coordinates as number[][][][];
        for (const polygon of polygons) {
          paths.push(polygonToPath(polygon, width, height));
        }
        break;
      }
    }
  }

  return paths;
}

const SVG_NS = "http://www.w3.org/2000/svg";

export async function renderTimeZones(
  overlayLayer: SVGGElement,
  source: string | GeoJsonFeatureCollection | undefined,
  width: number,
  height: number,
): Promise<void> {
  overlayLayer.replaceChildren();

  const paths = await buildTimezonePaths(width, height, source);

  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(204,51,51,0.6)");
    path.setAttribute("stroke-width", "0.4");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.setAttribute("pointer-events", "none");

    overlayLayer.append(path);
  }
}
