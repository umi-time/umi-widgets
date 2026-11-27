/**
 * Valid geographic coordinate limits expressed in decimal degrees.
 */
export const MIN_LATITUDE = -90;
export const MAX_LATITUDE = 90;
export const MIN_LONGITUDE = -180;
export const MAX_LONGITUDE = 180;

/**
 * Clamps a latitude value to the valid geographic range.
 *
 * @param lat Latitude in decimal degrees.
 * @returns The clamped latitude, or null if the value is not finite.
 */
export function clampLatitude(lat: number): number | null {
  if (!Number.isFinite(lat)) {
    return null;
  }

  return Math.max(MIN_LATITUDE, Math.min(MAX_LATITUDE, lat));
}

/**
 * Clamps a longitude value to the valid geographic range.
 *
 * @param lon Longitude in decimal degrees.
 * @returns The clamped longitude, or null if the value is not finite.
 */
export function clampLongitude(lon: number): number | null {
  if (!Number.isFinite(lon)) {
    return null;
  }

  return Math.max(MIN_LONGITUDE, Math.min(MAX_LONGITUDE, lon));
}
