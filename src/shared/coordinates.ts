export const MIN_LATITUDE = -90;
export const MAX_LATITUDE = 90;

export const MIN_LONGITUDE = -180;
export const MAX_LONGITUDE = 180;

/**
 * Clamps a latitude to the valid range [-90, 90].
 * Returns null for non-finite values.
 */
export function clampLatitude(lat: number): number | null {
  if (!Number.isFinite(lat)) {
    return null;
  }

  return Math.max(MIN_LATITUDE, Math.min(MAX_LATITUDE, lat));
}

/**
 * Clamps a longitude to the valid range [-180, 180].
 * Returns null for non-finite values.
 */
export function clampLongitude(lon: number): number | null {
  if (!Number.isFinite(lon)) {
    return null;
  }

  return Math.max(MIN_LONGITUDE, Math.min(MAX_LONGITUDE, lon));
}
