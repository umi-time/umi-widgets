import { UmiTime, toRad, utUmiFromDate, getHourAngle, toDeg } from "umi-time";

import {
  MAP_MIN_LATITUDE,
  MAP_MAX_LATITUDE,
  MAP_MIN_LONGITUDE,
  MAP_MAX_LONGITUDE,
  mercatorProject,
} from "./world-map-projection";

/**
 * A point on the computed day/night terminator line.
 */
export interface TerminatorPoint {
  /** Horizontal position in pixels. */
  x: number;

  /** Vertical position in pixels. */
  y: number;
}

const LAT_TOP = toRad(MAP_MAX_LATITUDE);
const LAT_BOTTOM = toRad(MAP_MIN_LATITUDE);
const EQUINOX_EPSILON = toRad(0.01);

/**
 * Geometry describing the day/night terminator rendered on the world map.
 */
export interface TerminatorGeometry {
  /** Points forming the projected terminator curve. */
  points: TerminatorPoint[];

  /**
   * Indicates whether the nighttime region extends across the top edge
   * of the map projection.
   */
  borderOnTop: boolean;
}

/**
 * Computes the projected day/night terminator for the specified time.
 *
 * The returned geometry can be used to render the boundary between the
 * illuminated and dark portions of the Earth on the world map.
 *
 * @param date Time for which to calculate the terminator.
 * @param width Width of the map in pixels.
 * @param height Height of the map in pixels.
 * @returns Projected terminator geometry for the map.
 */
export function computeTerminator(
  date: Date,
  width: number,
  height: number,
): TerminatorGeometry {
  const umi = new UmiTime(
    date,
    { value: 0, uncertainty: 0 },
    { value: 0, uncertainty: 0 },
  );

  const delta = toRad(umi.solarDeclination);
  const eot = umi.equationOfTime;
  const utDeg = utUmiFromDate(date);
  const hourAngleDeg = getHourAngle(utDeg, 0, eot);
  const lambdaS = toRad(-hourAngleDeg);
  const points: TerminatorPoint[] = [];

  for (
    let longitude = MAP_MIN_LONGITUDE;
    longitude <= MAP_MAX_LONGITUDE;
    longitude++
  ) {
    const lambda = toRad(longitude);

    let phi: number;

    if (Math.abs(delta) < EQUINOX_EPSILON) {
      phi = 0;
    } else {
      phi = Math.atan(-Math.cos(lambda - lambdaS) / Math.tan(delta));
    }

    const clampedPhi = Math.max(LAT_BOTTOM, Math.min(LAT_TOP, phi));
    const point = mercatorProject(
      toDeg(clampedPhi),
      longitude,
      width,
      height,
    );
    points.push(point);
  }

  return {
    points,
    borderOnTop: delta < 0,
  };
}
