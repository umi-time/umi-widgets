import {
  mercatorProject,
  MAP_MIN_LATITUDE,
  MAP_MAX_LATITUDE,
  MAP_MIN_LONGITUDE,
  MAP_MAX_LONGITUDE,
} from "./world-map-projection";

export interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;

  value: number;
  label: string;
  isMajor: boolean;
}

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
