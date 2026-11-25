import { UmiTime, toRad, utUmiFromDate, getHourAngle, toDeg } from "umi-time";

import {
  MAP_MIN_LATITUDE,
  MAP_MAX_LATITUDE,
  MAP_MIN_LONGITUDE,
  MAP_MAX_LONGITUDE,
  mercatorProject,
} from "./world-map-projection";

export interface TerminatorPoint {
  x: number;
  y: number;
}

const LAT_TOP = toRad(MAP_MAX_LATITUDE);
const LAT_BOTTOM = toRad(MAP_MIN_LATITUDE);
const EQUINOX_EPSILON = toRad(0.01);

export interface TerminatorGeometry {
  points: TerminatorPoint[];

  borderOnTop: boolean;
}

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
