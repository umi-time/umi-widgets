// src/elements/umi-world-map/world-map-projection.ts

export interface MapPoint {
  x: number;
  y: number;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Bounds of the current world-map SVG asset.
 *
 * These values come from the existing www world-map
 * implementation and should not be changed without
 * updating the artwork.
 */
export const MAP_MIN_LATITUDE = -74.78;
export const MAP_MAX_LATITUDE = 83.64;

export const MAP_MIN_LONGITUDE = -188;
export const MAP_MAX_LONGITUDE = 191;

const MERCATOR_TOP = mercatorY(MAP_MAX_LATITUDE);
const MERCATOR_BOTTOM = mercatorY(MAP_MIN_LATITUDE);
const LONGITUDE_SPAN = MAP_MAX_LONGITUDE - MAP_MIN_LONGITUDE;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function mercatorY(latitude: number): number {
  return Math.log(Math.tan(Math.PI / 4 + toRadians(latitude) / 2));
}

/**
 * Convert geographic coordinates to map coordinates.
 *
 * Returns x/y values in the range:
 *
 * x: 0 .. width
 * y: 0 .. height
 */
export function mercatorProject(
  latitude: number,
  longitude: number,
  width: number,
  height: number,
): MapPoint {
  const latitudeY = mercatorY(latitude);

  const x = ((longitude - MAP_MIN_LONGITUDE) / LONGITUDE_SPAN) * width;

  const y =
    ((MERCATOR_TOP - latitudeY) / (MERCATOR_TOP - MERCATOR_BOTTOM)) * height;

  return { x, y };
}

/**
 * Convert map coordinates back into
 * geographic coordinates.
 */
export function mercatorInverse(
  x: number,
  y: number,
  width: number,
  height: number,
): GeoPoint {
  const longitude = (x / width) * LONGITUDE_SPAN + MAP_MIN_LONGITUDE;

  const mercatorValue =
    MERCATOR_TOP - (y / height) * (MERCATOR_TOP - MERCATOR_BOTTOM);

  const latitude = toDegrees(Math.atan(Math.sinh(mercatorValue)));

  return {
    latitude,
    longitude,
  };
}
