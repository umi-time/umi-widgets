const D2R = Math.PI / 180;

export function parseHexColor(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = parseHexColor(c1);
  const [r2, g2, b2] = parseHexColor(c2);

  return (
    "#" +
    [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]
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
 * Builds a 360-degree CSS conic-gradient representing solar illumination
 * across the dial for a given latitude, solar declination, and equation of time.
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
    const altDeg =
      Math.asin(
        sinL * sinDec + cosL * cosDec * Math.cos(correctedHourAngle * D2R),
      ) / D2R;
    stops.push(`${solarElevationToColor(altDeg)} ${deg}deg`);
  }

  return `conic-gradient(${stops.join(", ")})`;
}
