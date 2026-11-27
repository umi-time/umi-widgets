import {
  mercatorProject,
  MAP_MIN_LATITUDE,
  MAP_MAX_LATITUDE,
  MAP_MIN_LONGITUDE,
  MAP_MAX_LONGITUDE,
} from "./world-map-projection";

/**
 * Describes a latitude or longitude grid line rendered on the world map.
 */
export interface GridLine {
  /** Starting x-coordinate in pixels. */
  x1: number;

  /** Starting y-coordinate in pixels. */
  y1: number;

  /** Ending x-coordinate in pixels. */
  x2: number;

  /** Ending y-coordinate in pixels. */
  y2: number;

  /** Latitude or longitude value represented by the line. */
  value: number;

  /** Display label for the grid line. */
  label: string;

  /** Indicates whether the line is a major grid interval. */
  isMajor: boolean;
}

/**
 * Builds the latitude grid lines used by the world map overlay.
 *
 * The returned lines include rendering coordinates, display labels,
 * and major/minor grid classifications.
 *
 * @param width Width of the map in pixels.
 * @param height Height of the map in pixels.
 * @returns Latitude grid line definitions for the map.
 */
export function buildLatitudeLines(width: number, height: number): GridLine[] {
  const lines: GridLine[] = [];

  for (let latitude = -75; latitude <= 75; latitude += 15) {
    if (latitude < MAP_MIN_LATITUDE || latitude > MAP_MAX_LATITUDE) {
      continue;
    }

    const left = mercatorProject(latitude, MAP_MIN_LONGITUDE, width, height);
    const right = mercatorProject(latitude, MAP_MAX_LONGITUDE, width, height);

    lines.push({
      x1: left.x,
      y1: left.y,
      x2: right.x,
      y2: right.y,

      value: latitude,
      label: formatLatitude(latitude),
      isMajor: latitude === 0,
    });
  }

  return lines;
}

/**
 * Builds the longitude grid lines used by the world map overlay.
 *
 * The returned lines include rendering coordinates, display labels,
 * and major/minor grid classifications.
 *
 * @param width Width of the map in pixels.
 * @param height Height of the map in pixels.
 * @returns Longitude grid line definitions for the map.
 */
export function buildLongitudeLines(width: number, height: number): GridLine[] {
  const lines: GridLine[] = [];

  for (let longitude = -180; longitude <= 180; longitude += 15) {
    if (longitude < MAP_MIN_LONGITUDE || longitude > MAP_MAX_LONGITUDE) {
      continue;
    }

    const top = mercatorProject(MAP_MAX_LATITUDE, longitude, width, height);
    const bottom = mercatorProject(MAP_MIN_LATITUDE, longitude, width, height);

    lines.push({
      x1: top.x,
      y1: top.y,
      x2: bottom.x,
      y2: bottom.y,

      value: longitude,
      label: formatLongitude(longitude),
      isMajor: longitude === 0,
    });
  }

  return lines;
}

function formatLatitude(latitude: number): string {
  if (latitude === 0) {
    return "0°";
  }

  return `${Math.abs(latitude)}°${latitude > 0 ? "N" : "S"}`;
}

function formatLongitude(longitude: number): string {
  if (longitude === 0) {
    return "0°";
  }

  return `${Math.abs(longitude)}°${longitude > 0 ? "E" : "W"}`;
}
