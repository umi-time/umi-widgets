// src/elements/umi-world-map/world-map-projection.ts

/**
 * A point in projected map coordinates.
 */
export interface MapPoint {
  /** Horizontal position in pixels. */
  x: number;

  /** Vertical position in pixels. */
  y: number;
}

/**
 * A geographic location expressed in latitude and longitude coordinates.
 */
export interface GeoPoint {
  /** Latitude in decimal degrees. */
  latitude: number;

  /** Longitude in decimal degrees. */
  longitude: number;
}

/**
 * Bounds of the current world map projection and SVG artwork.
 *
 * These values define the latitude and longitude limits represented by
 * the world-map asset and projection. They are derived from the existing
 * Umi-Time world map implementation and should not be changed without
 * verifying that the underlying artwork and projection remain aligned.
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
 * Projects geographic coordinates onto the world map.
 *
 * Converts latitude and longitude coordinates into map coordinates
 * within the bounds of the rendered projection.
 *
 * @param latitude Latitude in decimal degrees.
 * @param longitude Longitude in decimal degrees.
 * @param width Width of the map in pixels.
 * @param height Height of the map in pixels.
 * @returns Projected map coordinates.
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
 * Converts projected map coordinates back into geographic coordinates.
 *
 * This is the inverse of mercatorProject() and is typically used to
 * translate map positions into latitude and longitude values.
 *
 * @param x Horizontal map position in pixels.
 * @param y Vertical map position in pixels.
 * @param width Width of the map in pixels.
 * @param height Height of the map in pixels.
 * @returns Geographic coordinates in decimal degrees.
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
