// src/index.ts
export * from "./elements";

export {
  buildSolarConicGradient,
  buildSolarLinearGradient,
  lerpColor,
  parseHexColor,
  solarElevationToColor,
} from "./shared/colors";

export {
  clampLatitude,
  clampLongitude,
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "./shared/coordinates";

// Projection utilities exposed to support custom world-map overlays.
export {
  mercatorInverse,
  mercatorProject,
  MAP_MAX_LATITUDE,
  MAP_MAX_LONGITUDE,
  MAP_MIN_LATITUDE,
  MAP_MIN_LONGITUDE,
} from "./elements/umi-world-map/world-map-projection";
