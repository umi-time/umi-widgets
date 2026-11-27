const D2R = Math.PI / 180;

export function parseHexColor(hex: string): [number, number, number] {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * Linearly interpolates between two RGB hex colors.
 *
 * @param c1 Starting color in "#RRGGBB" format.
 * @param c2 Ending color in "#RRGGBB" format.
 * @param t Interpolation amount from 0.0 to 1.0.
 * @returns Interpolated color in "#RRGGBB" format.
 */
export function lerpColor(c1: string, c2: string, t: number): string {
  const tClamped = Math.max(0, Math.min(1, t));

  const [r1, g1, b1] = parseHexColor(c1);
  const [r2, g2, b2] = parseHexColor(c2);

  return (
    "#" +
    [r1 + (r2 - r1) * tClamped, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Maps solar elevation (in degrees) to a sky/twilight color stop.
 */
export function solarElevationToColor(elevationDeg: number): string {
  if (elevationDeg >= 6) return "#7EC8FF";
  if (elevationDeg >= 0) {
    return lerpColor("#B9E3FF", "#FFB347", (6 - elevationDeg) / 6);
  }
  if (elevationDeg >= -6) {
    return lerpColor("#FFB347", "#D62828", -elevationDeg / 6);
  }
  if (elevationDeg >= -18) {
    return lerpColor("#D62828", "#2A3B55", (-6 - elevationDeg) / 12);
  }
  return "#001F3F";
}

/**
 * Builds a 360-degree CSS conic gradient representing solar illumination
 * around a clock dial.
 *
 * The gradient visualizes daylight, twilight, and nighttime periods for
 * the specified latitude and solar conditions.
 *
 * @param latitudeDeg Latitude in decimal degrees.
 * @param solarDeclinationDeg Solar declination in degrees.
 * @param equationOfTimeMinutes Equation of time in minutes.
 * @returns A CSS conic-gradient() string suitable for use as a background.
 */
export function buildSolarConicGradient(
  latitudeDeg: number,
  solarDeclinationDeg: number,
  equationOfTimeMinutes: number,
): string {
  const eotDeg = equationOfTimeMinutes / 4;
  const sinL = Math.sin(latitudeDeg * D2R);
  const cosL = Math.cos(latitudeDeg * D2R);
  const sinDec = Math.sin(solarDeclinationDeg * D2R);
  const cosDec = Math.cos(solarDeclinationDeg * D2R);

  const stops: string[] = [];

  for (let deg = 0; deg < 360; deg += 6) {
    const correctedHourAngle = deg + eotDeg;
    const sinAlt =
      sinL * sinDec + cosL * cosDec * Math.cos(correctedHourAngle * D2R);

    const altDeg = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / D2R;
    stops.push(`${solarElevationToColor(altDeg)} ${deg}deg`);
  }

  return `conic-gradient(${stops.join(", ")})`;
}

/**
 * Builds a CSS linear gradient representing solar illumination across
 * a complete 0–360 umi day for a specific location.
 *
 * The gradient visualizes daylight, twilight, and nighttime periods
 * along the timeline of a Umi-Time day.
 *
 * @param latitudeDeg Latitude in decimal degrees.
 * @param longitudeDeg Longitude in decimal degrees.
 * @param solarDeclinationDeg Solar declination in degrees.
 * @param equationOfTimeMinutes Equation of time in minutes.
 * @returns A CSS linear-gradient() string suitable for use as a background.
 */
export function buildSolarLinearGradient(
  latitudeDeg: number,
  longitudeDeg: number,
  solarDeclinationDeg: number,
  equationOfTimeMinutes: number,
): string {
  const eotDeg = equationOfTimeMinutes / 4;
  const sinL = Math.sin(latitudeDeg * D2R);
  const cosL = Math.cos(latitudeDeg * D2R);
  const sinDec = Math.sin(solarDeclinationDeg * D2R);
  const cosDec = Math.cos(solarDeclinationDeg * D2R);

  const stops: string[] = [];

  for (let umi = 0; umi <= 360; umi += 6) {
    // Local solar hour angle: 0° at solar noon (localAngle = 180°)
    const localAngle = (((umi + longitudeDeg) % 360) + 360) % 360;
    const hourAngleDeg = localAngle - 180 + eotDeg;
    const sinAlt = sinL * sinDec + cosL * cosDec * Math.cos(hourAngleDeg * D2R);

    const altDeg = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / D2R;

    const pct = ((umi / 360) * 100).toFixed(2);
    stops.push(`${solarElevationToColor(altDeg)} ${pct}%`);
  }

  return `linear-gradient(to right, ${stops.join(", ")})`;
}
