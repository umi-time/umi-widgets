// src/elements/umi-world-map/world-map-clock.ts

import { UmiTime, toRad, solarAltitude } from "umi-time";

const BASE_CLOCK_RADIUS = 80;
const DEFAULT_CLOCK_SIZE = 180;

const SOLAR_RING_GAP_RATIO = 1 / 85;

const HAND_LENGTH_RATIO = 62 / 85;
const HAND_WIDTH_RATIO = 9 / 85;

const HUB_RADIUS_RATIO = 8 / 85;
const HUB_CAP_RADIUS_RATIO = 3 / 85;

const FONT_SIZE_RATIO = 24 / 85;
const LABEL_OFFSET_RATIO = 20 / 85;

const MINOR_TICK_INSET_RATIO = 3 / 85;
const MINOR_TICK_OUTSET_RATIO = 1 / 85;

const MAJOR_TICK_INSET_RATIO = 5 / 85;
const MAJOR_TICK_OUTSET_RATIO = 1 / 85;

const SUN_INDICATOR_INSET_RATIO = 2 / 85;
const SUN_INDICATOR_OUTSET_RATIO = 4 / 85;

const HAND_HUB_OVERLAP_RATIO = 0.3;
const SOLAR_GRADIENT_STEP = 0.5;

/**
 * Configuration options used when rendering a clock on the world map.
 */
export interface WorldMapClockOptions {
  /** Latitude in decimal degrees. */
  latitude: number;

  /** Longitude in decimal degrees. */
  longitude: number;

  /** Time represented by the clock. */
  date: Date;

  /** Optional clock width in pixels. */
  width?: number;

  /** Optional clock height in pixels. */
  height?: number;
}

/**
 * Precomputed dimensions used when rendering a world map clock.
 *
 * All measurements are derived from the rendered clock size and are used
 * to position and draw clock features consistently.
 */
export interface ClockGeometry {
  /** Center x-coordinate of the clock. */
  cx: number;

  /** Center y-coordinate of the clock. */
  cy: number;

  /** Outer radius of the clock face. */
  radius: number;

  /** Radius of the solar ring. */
  solarRadius: number;

  /** Width of the solar ring. */
  solarRingWidth: number;

  /** Height of the noon/midnight indicator triangles. */
  triangleHeight: number;

  /** Half-width of the noon/midnight indicator triangles. */
  triangleHalfWidth: number;

  /** Radius of the center hub. */
  hubRadius: number;

  /** Radius of the inner hub circle. */
  hubInnerRadius: number;

  /** Font size used for dial labels. */
  fontSize: number;

  /** Inner offset of minor tick marks. */
  minorTickInnerOffset: number;

  /** Outer offset of minor tick marks. */
  minorTickOuterOffset: number;

  /** Inner offset of major tick marks. */
  majorTickInnerOffset: number;

  /** Outer offset of major tick marks. */
  majorTickOuterOffset: number;

  /** Distance from the center to dial labels. */
  labelOffset: number;

  /** Inner offset of sunrise and sunset indicators. */
  sunIndicatorInnerOffset: number;

  /** Outer offset of sunrise and sunset indicators. */
  sunIndicatorOuterOffset: number;
}

/**
 * Computes the geometric measurements used to render a world map clock
 * at the specified size.
 *
 * The returned dimensions are scaled proportionally and can be reused
 * by the clock rendering functions to ensure consistent layout.
 *
 * @param width Width of the clock in pixels.
 * @param height Height of the clock in pixels.
 * @returns Precomputed clock geometry values.
 */
export function createGeometry(width: number, height: number): ClockGeometry {
  const size = Math.min(width, height);

  const radius = size * (BASE_CLOCK_RADIUS / DEFAULT_CLOCK_SIZE);
  const solarRingWidth = Math.max(4, radius * 0.08);

  const solarRingGap = radius * SOLAR_RING_GAP_RATIO;

  return {
    cx: width / 2,
    cy: height / 2,
    radius,
    solarRadius: radius + solarRingGap + solarRingWidth / 2,
    solarRingWidth,
    triangleHeight: radius * HAND_LENGTH_RATIO,
    triangleHalfWidth: radius * HAND_WIDTH_RATIO,
    hubRadius: radius * HUB_RADIUS_RATIO,
    hubInnerRadius: radius * HUB_CAP_RADIUS_RATIO,
    fontSize: radius * FONT_SIZE_RATIO,
    minorTickInnerOffset: radius * MINOR_TICK_INSET_RATIO,
    minorTickOuterOffset: radius * MINOR_TICK_OUTSET_RATIO,
    majorTickInnerOffset: radius * MAJOR_TICK_INSET_RATIO,
    majorTickOuterOffset: radius * MAJOR_TICK_OUTSET_RATIO,
    labelOffset: radius * LABEL_OFFSET_RATIO,
    sunIndicatorInnerOffset: radius * SUN_INDICATOR_INSET_RATIO,
    sunIndicatorOuterOffset: radius * SUN_INDICATOR_OUTSET_RATIO,
  };
}

/**
 * Renders a Umi-Time clock onto a canvas at the specified location and time.
 *
 * The rendered clock includes the dial, solar ring, tick marks, labels,
 * sunrise and sunset indicators, and clock hand.
 *
 * @param ctx Canvas rendering context used for drawing.
 * @param options Clock rendering options including location and time.
 */
export function renderWorldMapClock(
  ctx: CanvasRenderingContext2D,
  options: WorldMapClockOptions,
): void {
  const { latitude, longitude, date } = options;

  const width = options.width ?? DEFAULT_CLOCK_SIZE;
  const height = options.height ?? DEFAULT_CLOCK_SIZE;

  const geometry = createGeometry(width, height);

  const umi = new UmiTime(
    date,
    { value: latitude, uncertainty: 0 },
    { value: longitude, uncertainty: 0 },
  );

  const decl = umi.solarDeclination;
  const eot = umi.equationOfTime;

  const handAngle = computeUmiDialAngle(latitude, longitude, date);

  ctx.clearRect(0, 0, width, height);

  drawUmiDial(ctx, geometry, handAngle, umi);

  drawConicGradient(ctx, geometry, latitude, decl, eot);

  const dialAngle = computeDialRotation(longitude);

  drawDialTicks(
    ctx,
    geometry.cx,
    geometry.cy,
    geometry.radius,
    dialAngle,
    geometry,
  );

  drawDialLabels(
    ctx,
    geometry.cx,
    geometry.cy,
    geometry.radius,
    dialAngle,
    geometry,
  );

  const sunriseDial = computeSunIndicatorAngle(umi.sunrise, longitude);
  const sunsetDial = computeSunIndicatorAngle(umi.sunset, longitude);

  drawSunIndicators(ctx, geometry, sunriseDial, sunsetDial);
}

/**
 * Computes the rotation angle that aligns a clock dial with the specified
 * longitude on the world map.
 *
 * @param longitude Longitude in decimal degrees.
 * @returns Dial rotation angle in degrees.
 */
export function computeDialRotation(longitude: number): number {
  return 180 + longitude;
}

/**
 * Computes the angle of a sunrise or sunset indicator after applying the
 * dial rotation for the specified longitude.
 *
 * @param umiAngle Sunrise or sunset angle in umi-space, or null when the
 * corresponding event does not occur.
 * @param longitude Longitude in decimal degrees.
 * @returns The rotated indicator angle in degrees, or null if no indicator
 * should be rendered.
 */
export function computeSunIndicatorAngle(
  umiAngle: number | null,
  longitude: number,
): number | null {
  if (umiAngle === null) {
    return null;
  }

  return umiAngle + computeDialRotation(longitude);
}

function normalizeAngle(angle: number): number {
  angle %= 360;

  if (angle < 0) {
    angle += 360;
  }

  return angle;
}

/**
 * Computes the angle of the Umi-Time hand for the specified location and time.
 *
 * The returned angle accounts for both longitude and solar conditions so
 * that the dial reflects the local interpretation of the current Umi-Time.
 *
 * @param latitude Latitude in decimal degrees.
 * @param longitude Longitude in decimal degrees.
 * @param date Time to evaluate.
 * @returns Clock-hand angle in degrees.
 */
export function computeUmiDialAngle(
  latitude: number,
  longitude: number,
  date: Date,
): number {
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;

  const umi = new UmiTime(
    date,
    { value: latitude, uncertainty: 0 },
    { value: longitude, uncertainty: 0 },
  );

  const eot = umi.equationOfTime;
  const solarTimeHours = utcHours + longitude / 15 + eot / 60;

  return normalizeAngle((solarTimeHours / 24) * 360 + 180);
}

function drawUmiValue(
  ctx: CanvasRenderingContext2D,
  umiText: string,
  baseX: number,
  baseY: number,
  fontSize: number,
): void {
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = "middle";

  const metrics = ctx.measureText(umiText);
  const textWidth = metrics.width;
  const textHeight = metrics.actualBoundingBoxAscent;
  const symbolRadius = fontSize * 0.1;
  const symbolGap = fontSize * 0.05;
  const totalWidth = textWidth + symbolGap + symbolRadius * 2;
  const startX = baseX - totalWidth / 2;

  ctx.fillStyle = "#111";
  ctx.textAlign = "left";
  ctx.fillText(umiText, startX, baseY);

  //
  // Umi symbol:
  // same idea as degree sign,
  // circle with top quarter removed
  //
  const symbolCenterX = startX + textWidth + symbolGap + symbolRadius;
  const symbolCenterY = baseY - textHeight + symbolRadius * 0.5;

  ctx.strokeStyle = "#111";
  ctx.lineWidth = Math.max(1, fontSize * 0.08);
  ctx.beginPath();
  ctx.arc(
    symbolCenterX,
    symbolCenterY,
    symbolRadius,
    -Math.PI * 0.25,
    Math.PI * 1.25,
  );
  ctx.stroke();
}

/**
 * Draws the main Umi-Time dial, including the hand and associated dial
 * features, using the supplied geometry and Umi-Time value.
 *
 * @param ctx Canvas rendering context used for drawing.
 * @param geometry Precomputed clock geometry.
 * @param angle Clock-hand angle in degrees.
 * @param umi Umi-Time value represented by the dial.
 */
export function drawUmiDial(
  ctx: CanvasRenderingContext2D,
  geometry: ClockGeometry,
  angle: number,
  umi: UmiTime,
): void {
  const {
    cx,
    cy,
    radius,
    triangleHeight,
    triangleHalfWidth,
    hubRadius,
    hubInnerRadius,
  } = geometry;

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = radius;

  ctx.beginPath();
  ctx.arc(cx, cy, radius / 2, 0, Math.PI * 2);
  ctx.stroke();

  const rad = toRad(angle);

  //
  // Rotated hand + hub
  //
  ctx.save();

  ctx.translate(cx, cy);
  ctx.rotate(rad);

  ctx.beginPath();

  const handBaseY = -hubRadius * HAND_HUB_OVERLAP_RATIO;

  ctx.moveTo(-triangleHalfWidth, handBaseY);
  ctx.lineTo(triangleHalfWidth, handBaseY);
  ctx.lineTo(0, -triangleHeight);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(
    -triangleHalfWidth,
    0,
    triangleHalfWidth,
    -triangleHeight,
  );

  gradient.addColorStop(0, "#888");
  gradient.addColorStop(0.4, "#333");
  gradient.addColorStop(1, "#000");

  ctx.fillStyle = gradient;
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 0.75;

  ctx.fill();
  ctx.stroke();

  ctx.beginPath();

  ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);

  ctx.fillStyle = "#444";
  ctx.fill();

  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();

  ctx.arc(0, 0, hubInnerRadius, 0, Math.PI * 2);

  ctx.fillStyle = "#ddd";
  ctx.fill();

  ctx.restore();

  //
  // Upright umi value
  //
  ctx.save();

  ctx.translate(cx, cy);

  const normalizedAngle = ((angle % 360) + 360) % 360;
  const pointingUp = normalizedAngle < 90 || normalizedAngle > 270;
  const textY = pointingUp ? radius * 0.35 : -radius * 0.35;
  const fontSize = radius * 0.38;

  const umiText = umi.format("uuu");
  drawUmiValue(ctx, umiText, 0, textY, fontSize);

  ctx.restore();
}

/**
 * Draws sunrise and sunset indicators on the clock dial.
 *
 * The indicators mark the directions of sunrise and sunset relative to
 * the clock's current orientation.
 *
 * @param ctx Canvas rendering context used for drawing.
 * @param geometry Precomputed clock geometry.
 * @param sunriseDial Sunrise indicator angle in degrees, or null when no
 * sunrise occurs.
 * @param sunsetDial Sunset indicator angle in degrees, or null when no
 * sunset occurs.
 */
export function drawSunIndicators(
  ctx: CanvasRenderingContext2D,
  geometry: ClockGeometry,
  sunriseDial: number | null,
  sunsetDial: number | null,
): void {
  const { cx, cy, radius, sunIndicatorInnerOffset, sunIndicatorOuterOffset } =
    geometry;

  const toCanvasRadians = (angle: number) => toRad(angle - 90);

  [sunriseDial, sunsetDial].forEach((angle) => {
    if (angle === null) {
      return;
    }

    const rad = toCanvasRadians(angle);

    const x1 = cx + Math.cos(rad) * (radius - sunIndicatorInnerOffset);
    const y1 = cy + Math.sin(rad) * (radius - sunIndicatorInnerOffset);
    const x2 = cx + Math.cos(rad) * (radius + sunIndicatorOuterOffset);
    const y2 = cy + Math.sin(rad) * (radius + sunIndicatorOuterOffset);

    ctx.strokeStyle = "#000";
    ctx.lineWidth = Math.max(3, radius * 0.06);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
}

/**
 * Draws the solar gradient ring for a world map clock.
 *
 * The gradient visualizes daylight, twilight, and nighttime conditions
 * for the specified latitude and solar conditions.
 *
 * @param ctx Canvas rendering context used for drawing.
 * @param geometry Precomputed clock geometry.
 * @param latitude Latitude in decimal degrees.
 * @param solarDeclination Solar declination in degrees.
 * @param equationOfTime Equation of time in minutes.
 */
export function drawConicGradient(
  ctx: CanvasRenderingContext2D,
  geometry: ClockGeometry,
  latitude: number,
  solarDeclination: number,
  equationOfTime: number,
): void {
  for (let angle = 0; angle < 360; angle += SOLAR_GRADIENT_STEP) {
    const hourAngle = angle + equationOfTime / 4;
    const elevation = solarAltitude(latitude, solarDeclination, hourAngle);
    const color = elevToColor(elevation);

    ctx.beginPath();

    ctx.strokeStyle = color;
    ctx.lineWidth = geometry.solarRingWidth;

    ctx.arc(
      geometry.cx,
      geometry.cy,
      geometry.solarRadius,
      toRad(angle - 90),
      toRad(angle - 90 + SOLAR_GRADIENT_STEP),
    );

    ctx.stroke();
  }
}

/**
 * Draws the major and minor tick marks around the clock dial.
 *
 * @param ctx Canvas rendering context used for drawing.
 * @param cx Center x-coordinate of the clock.
 * @param cy Center y-coordinate of the clock.
 * @param radius Outer radius of the clock face.
 * @param dialRotationDeg Dial rotation angle in degrees.
 * @param geometry Precomputed clock geometry.
 */
export function drawDialTicks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  dialRotationDeg: number,
  geometry: ClockGeometry,
): void {
  const toCanvasRadians = (deg: number) => toRad(deg + dialRotationDeg - 90);

  for (let deg = 0; deg < 360; deg += 6) {
    const rad = toCanvasRadians(deg);

    const r1 = radius - geometry.minorTickInnerOffset;

    const r2 = radius - geometry.minorTickOuterOffset;

    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(cx + Math.cos(rad) * r1, cy + Math.sin(rad) * r1);

    ctx.lineTo(cx + Math.cos(rad) * r2, cy + Math.sin(rad) * r2);

    ctx.stroke();
  }

  for (let deg = 0; deg < 360; deg += 30) {
    const rad = toCanvasRadians(deg);

    const r1 = radius - geometry.majorTickInnerOffset;

    const r2 = radius - geometry.majorTickOuterOffset;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = Math.max(2, radius * 0.04);

    ctx.beginPath();

    ctx.moveTo(cx + Math.cos(rad) * r1, cy + Math.sin(rad) * r1);

    ctx.lineTo(cx + Math.cos(rad) * r2, cy + Math.sin(rad) * r2);

    ctx.stroke();
  }
}

/**
 * Draws the numeric labels around the clock dial.
 *
 * Labels are positioned according to the dial rotation and precomputed
 * clock geometry.
 *
 * @param ctx Canvas rendering context used for drawing.
 * @param cx Center x-coordinate of the clock.
 * @param cy Center y-coordinate of the clock.
 * @param radius Outer radius of the clock face.
 * @param dialRotationDeg Dial rotation angle in degrees.
 * @param geometry Precomputed clock geometry.
 */
export function drawDialLabels(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  dialRotationDeg: number,
  geometry: ClockGeometry,
): void {
  const labels = [0, 60, 120, 180, 240, 300];

  for (const value of labels) {
    const dialDeg = value + dialRotationDeg;
    const rad = toRad(dialDeg - 90);
    const r = radius - geometry.labelOffset;
    const x = cx + Math.cos(rad) * r;
    const y = cy + Math.sin(rad) * r;

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(rad + Math.PI / 2);

    drawUmiValue(ctx, String(value), 0, 0, geometry.fontSize);

    ctx.restore();
  }
}

function lerpColor(c1: string, c2: string, t: number): string {
  const parse = (color: string): [number, number, number] => [
    parseInt(color.slice(1, 3), 16),
    parseInt(color.slice(3, 5), 16),
    parseInt(color.slice(5, 7), 16),
  ];

  const [r1, g1, b1] = parse(c1);

  const [r2, g2, b2] = parse(c2);

  return (
    "#" +
    [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]
      .map((value) => Math.round(value).toString(16).padStart(2, "0"))
      .join("")
  );
}

function elevToColor(elevation: number): string {
  if (elevation >= 6) {
    return "#7EC8FF";
  }

  if (elevation >= 0) {
    return lerpColor("#B9E3FF", "#FFB347", (6 - elevation) / 6);
  }

  if (elevation >= -6) {
    return lerpColor("#FFB347", "#D62828", -elevation / 6);
  }

  if (elevation >= -18) {
    return lerpColor("#D62828", "#2A3B55", (-6 - elevation) / 12);
  }

  const t = Math.min(1, Math.max(0, (-18 - elevation) / 72));

  return lerpColor("#2A3B55", "#001F3F", t);
}
