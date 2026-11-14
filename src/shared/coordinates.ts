export function clampLatitude(lat: number): number | null {
  if (!Number.isFinite(lat)) return null;
  if (lat > 90) return 90;
  if (lat < -90) return -90;
  return lat;
}

export function clampLongitude(lon: number): number | null {
  if (!Number.isFinite(lon)) return null;
  if (lon > 180) return 180;
  if (lon < -180) return -180;
  return lon;
}
