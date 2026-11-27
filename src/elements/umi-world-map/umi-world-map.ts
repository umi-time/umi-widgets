// src/elements/umi-world-map/umi-world-map.ts
import defaultMapSvg from "./assets/mercator.svg";

const DEFAULT_MAP_KEY = "__default__";

import { UmiTime } from "umi-time";
import "../umi-location";

import type { UmiLocation } from "../umi-location";
import { mercatorInverse, mercatorProject } from "./world-map-projection";
import { computeTerminator } from "./world-map-terminator";
import { renderWorldMapClock } from "./world-map-clock";
import { buildLatitudeLines, buildLongitudeLines } from "./world-map-grid";

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEWBOX_WIDTH = 1652.4702;
const VIEWBOX_HEIGHT = 1220.6385;
const CURSOR_CLOCK_SIZE = 180;
const PINNED_CLOCK_SIZE = 120;
const CLOCK_CANVAS_SCALE = 4;
const TERMINATOR_OPACITY = 0.35;

/**
 * Shared by all <umi-world-map> instances.
 * The SVG is fetched once and reused.
 */
const svgCache = new Map<string, string>();

const svgPromises = new Map<string, Promise<string>>();

async function loadMapSvg(src: string): Promise<string> {
  const cached = svgCache.get(src);

  if (cached) {
    return cached;
  }

  const existingPromise = svgPromises.get(src);

  if (existingPromise) {
    return existingPromise;
  }

  const promise = fetch(src)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load map SVG: ${response.status}`);
      }

      return response.text();
    })
    .then((svg) => {
      svgCache.set(src, svg);
      return svg;
    })
    .finally(() => {
      svgPromises.delete(src);
    });

  svgPromises.set(src, promise);

  return promise;
}

/**
 * Supported attributes for the <umi-world-map> element.
 */
export type UmiWorldMapAttribute =
  | "value"
  | "offset"
  | "live"
  | "dark"
  | "show-terminator"
  | "show-latitude-grid"
  | "show-longitude-grid"
  | "show-pinned-clocks"
  | "show-cursor-clock"
  | "show-map-overlay"
  | "show-grid-overlay"
  | "show-terminator-overlay"
  | "show-clock-overlay"
  | "update-interval"
  | "src";

/**
 * Displays an interactive Mercator-projected view of the Earth with
 * Umi-Time visualizations and overlays.
 *
 * The map can display daylight and nighttime regions, latitude and
 * longitude grids, timezone boundaries, pinned locations, and
 * location-aware Umi-Time clocks.
 *
 * @event umi-location-hover Fired when the pointer moves over the map.
 * detail: GeoPoint
 */
export class UmiWorldMap extends HTMLElement {
  static get observedAttributes(): readonly UmiWorldMapAttribute[] {
    return [
      "value",
      "offset",
      "live",
      "dark",
      "show-terminator",
      "show-latitude-grid",
      "show-longitude-grid",
      "show-pinned-clocks",
      "show-cursor-clock",
      "show-map-overlay",
      "show-grid-overlay",
      "show-terminator-overlay",
      "show-clock-overlay",
      "update-interval",
      "src",
    ];
  }

  private shadow: ShadowRoot;

  private svg!: SVGSVGElement;
  private mapContentLayer!: SVGGElement;
  private latitudeGridLayer!: SVGGElement;
  private longitudeGridLayer!: SVGGElement;
  private terminatorLayer!: SVGGElement;
  private pinnedClockLayer!: SVGGElement;
  private cursorClockLayer!: SVGGElement;

  private mapOverlayLayer!: SVGGElement;
  private gridOverlayLayer!: SVGGElement;
  private terminatorOverlayLayer!: SVGGElement;
  private clockOverlayLayer!: SVGGElement;

  private mutationObserver?: MutationObserver;
  private timer: number | undefined;
  private pinnedClocksLastUmi: number | undefined;
  private cursorClockLastUmi: number | undefined;
  private terminatorLastUmi: number | undefined;
  private latitudeGridDirty = true;
  private longitudeGridDirty = true;

  private loadedMapSrc: string | null = null;
  private cursorLatitude = 0;
  private cursorLongitude = 0;
  private selectedLocation: UmiLocation | null = null;

  private _value = "";
  private _offset = 0;
  private _live = false;
  private _dark = false;

  private _showTerminator = false;
  private _showLatitudeGrid = false;
  private _showLongitudeGrid = false;
  private _showPinnedClocks = false;
  private _showCursorClock = false;

  private _showMapOverlay = false;
  private _showGridOverlay = false;
  private _showTerminatorOverlay = false;
  private _showClockOverlay = false;

  private _updateInterval = 250;
  private _src = "";

  /** Base UTC timestamp displayed by the map when live mode is disabled. */
  public get value(): string {
    return this._value;
  }

  public set value(value: string) {
    this._value = value;

    if (this.getAttribute("value") !== value) {
      this.setAttribute("value", value);
    }
  }

  /** Umi offset applied to the displayed time. */
  public get offset(): number {
    return this._offset;
  }

  public set offset(value: number) {
    this._offset = value;

    const attributeValue = String(value);

    if (this.getAttribute("offset") !== attributeValue) {
      this.setAttribute("offset", attributeValue);
    }
  }

  /** Enables automatic updates using the current time. */
  public get live(): boolean {
    return this._live;
  }

  public set live(value: boolean) {
    this._live = value;

    if (this.hasAttribute("live") !== value) {
      this.toggleAttribute("live", value);
    }
  }

  /** Enables the dark color scheme when true. */
  public get dark(): boolean {
    return this._dark;
  }

  public set dark(value: boolean) {
    this._dark = value;

    if (this.hasAttribute("dark") !== value) {
      this.toggleAttribute("dark", value);
    }
  }

  /** Displays the day/night terminator. */
  public get showTerminator(): boolean {
    return this._showTerminator;
  }

  public set showTerminator(value: boolean) {
    this._showTerminator = value;

    if (this.hasAttribute("show-terminator") !== value) {
      this.toggleAttribute("show-terminator", value);
    }
  }

  /** Displays latitude grid lines. */
  public get showLatitudeGrid(): boolean {
    return this._showLatitudeGrid;
  }

  public set showLatitudeGrid(value: boolean) {
    this._showLatitudeGrid = value;

    if (this.hasAttribute("show-latitude-grid") !== value) {
      this.toggleAttribute("show-latitude-grid", value);
    }
  }

  /** Displays longitude grid lines. */
  public get showLongitudeGrid(): boolean {
    return this._showLongitudeGrid;
  }

  public set showLongitudeGrid(value: boolean) {
    this._showLongitudeGrid = value;

    if (this.hasAttribute("show-longitude-grid") !== value) {
      this.toggleAttribute("show-longitude-grid", value);
    }
  }

  /** Displays clocks pinned to configured locations. */
  public get showPinnedClocks(): boolean {
    return this._showPinnedClocks;
  }

  public set showPinnedClocks(value: boolean) {
    this._showPinnedClocks = value;

    if (this.hasAttribute("show-pinned-clocks") !== value) {
      this.toggleAttribute("show-pinned-clocks", value);
    }
  }

  /** Displays the interactive cursor clock. */
  public get showCursorClock(): boolean {
    return this._showCursorClock;
  }

  public set showCursorClock(value: boolean) {
    this._showCursorClock = value;

    if (this.hasAttribute("show-cursor-clock") !== value) {
      this.toggleAttribute("show-cursor-clock", value);
    }
  }

  /** Displays the custom map overlay layer. */
  public get showMapOverlay(): boolean {
    return this._showMapOverlay;
  }

  public set showMapOverlay(value: boolean) {
    this._showMapOverlay = value;

    if (this.hasAttribute("show-map-overlay") !== value) {
      this.toggleAttribute("show-map-overlay", value);
    }
  }

  /** Displays the grid overlay layer. */
  public get showGridOverlay(): boolean {
    return this._showGridOverlay;
  }

  public set showGridOverlay(value: boolean) {
    this._showGridOverlay = value;

    if (this.hasAttribute("show-grid-overlay") !== value) {
      this.toggleAttribute("show-grid-overlay", value);
    }
  }

  /** Displays the terminator overlay layer. */
  public get showTerminatorOverlay(): boolean {
    return this._showTerminatorOverlay;
  }

  public set showTerminatorOverlay(value: boolean) {
    this._showTerminatorOverlay = value;

    if (this.hasAttribute("show-terminator-overlay") !== value) {
      this.toggleAttribute("show-terminator-overlay", value);
    }
  }

  /** Displays the clock overlay layer. */
  public get showClockOverlay(): boolean {
    return this._showClockOverlay;
  }

  public set showClockOverlay(value: boolean) {
    this._showClockOverlay = value;

    if (this.hasAttribute("show-clock-overlay") !== value) {
      this.toggleAttribute("show-clock-overlay", value);
    }
  }

  /** Refresh interval in milliseconds when live mode is enabled. */
  public get updateInterval(): number {
    return this._updateInterval;
  }

  public set updateInterval(value: number) {
    this._updateInterval = value;

    const attributeValue = String(value);

    if (this.getAttribute("update-interval") !== attributeValue) {
      this.setAttribute("update-interval", attributeValue);
    }
  }

  /** URL of the world map image asset. */
  public get src(): string {
    return this._src;
  }

  public set src(value: string) {
    this._src = value;

    if (this.getAttribute("src") !== value) {
      this.setAttribute("src", value);
    }
  }

  constructor() {
    super();

    this.shadow = this.attachShadow({
      mode: "open",
    });

    this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          aspect-ratio: 1652.4702 / 1220.6385;
        }

        svg {
          width: 100%;
          height: auto;
        }

        .cursor-clock-active,
        .cursor-clock-active * {
          cursor: none;
        }
      </style>

      <svg
        viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}"
        part="map">
      </svg>
    `;

    this.svg = this.shadow.querySelector("svg")!;

    this.mapContentLayer = document.createElementNS(SVG_NS, "g");
    this.latitudeGridLayer = document.createElementNS(SVG_NS, "g");
    this.longitudeGridLayer = document.createElementNS(SVG_NS, "g");
    this.terminatorLayer = document.createElementNS(SVG_NS, "g");
    this.pinnedClockLayer = document.createElementNS(SVG_NS, "g");
    this.cursorClockLayer = document.createElementNS(SVG_NS, "g");

    this.mapOverlayLayer = document.createElementNS(SVG_NS, "g");
    this.mapOverlayLayer.setAttribute("id", "map-overlay");

    this.gridOverlayLayer = document.createElementNS(SVG_NS, "g");
    this.gridOverlayLayer.setAttribute("id", "grid-overlay");

    this.terminatorOverlayLayer = document.createElementNS(SVG_NS, "g");
    this.terminatorOverlayLayer.setAttribute("id", "terminator-overlay");

    this.clockOverlayLayer = document.createElementNS(SVG_NS, "g");
    this.clockOverlayLayer.setAttribute("id", "clock-overlay");

    this.svg.append(
      this.mapContentLayer,
      this.mapOverlayLayer,
      this.latitudeGridLayer,
      this.longitudeGridLayer,
      this.gridOverlayLayer,
      this.terminatorLayer,
      this.terminatorOverlayLayer,
      this.pinnedClockLayer,
      this.clockOverlayLayer,
      this.cursorClockLayer,
    );
  }

  /**
   * Returns the SVG layer used for custom map overlays.
   *
   * Consumers can append additional SVG content to this layer to extend
   * the world map visualization.
   */
  public getMapOverlayLayer(): SVGGElement {
    return this.mapOverlayLayer;
  }

  /**
   * Returns the SVG layer used for latitude and longitude grid overlays.
   *
   * Consumers can append additional SVG content to this layer to extend
   * the world map visualization.
   */
  public getGridOverlayLayer(): SVGGElement {
    return this.gridOverlayLayer;
  }

  /**
   * Returns the SVG layer used to render the day/night terminator overlay.
   *
   * Consumers can append additional SVG content to this layer to extend
   * the world map visualization.
   */
  public getTerminatorOverlayLayer(): SVGGElement {
    return this.terminatorOverlayLayer;
  }

  /**
   * Returns the SVG layer used to render world map clock overlays.
   *
   * Consumers can append additional SVG content to this layer to extend
   * the world map visualization.
   */
  public getClockOverlayLayer(): SVGGElement {
    return this.clockOverlayLayer;
  }

  connectedCallback(): void {
    this.installPointerHandlers();

    this.mutationObserver = new MutationObserver(() => {
      this.pinnedClocksLastUmi = undefined;
      this.cursorClockLastUmi = undefined;
      this.terminatorLastUmi = undefined;
      this.latitudeGridDirty = true;
      this.longitudeGridDirty = true;

      void this.render();
    });

    this.mutationObserver.observe(this, {
      childList: true,
      subtree: true,
    });

    this.start();

    void this.render();
  }

  disconnectedCallback(): void {
    this.stop();
    this.mutationObserver?.disconnect();
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    value: string | null,
  ): void {
    if (_oldValue === value) {
      return;
    }

    switch (name as UmiWorldMapAttribute) {
      case "value":
        this._value = value ?? "";
        this.onTimeChanged();
        break;

      case "offset": {
        const parsed = Number(value);

        this._offset = Number.isFinite(parsed) ? parsed : 0;
        this.onTimeChanged();
        break;
      }

      case "live":
        this._live = value !== null;
        this.onTimeChanged();
        this.start();
        break;

      case "dark":
        this._dark = value !== null;
        break;

      case "show-terminator":
        this._showTerminator = value !== null;
        this.terminatorLastUmi = undefined;
        break;

      case "show-latitude-grid":
        this._showLatitudeGrid = value !== null;
        this.latitudeGridDirty = true;
        break;

      case "show-longitude-grid":
        this._showLongitudeGrid = value !== null;
        this.longitudeGridDirty = true;
        break;

      case "show-pinned-clocks":
        this._showPinnedClocks = value !== null;
        this.pinnedClocksLastUmi = undefined;
        break;

      case "show-cursor-clock":
        this._showCursorClock = value !== null;
        this.cursorClockLastUmi = undefined;
        this.updateCursorVisibility();
        break;

      case "show-map-overlay":
        this._showMapOverlay = value !== null;
        this.mapOverlayLayer.style.display = this._showMapOverlay
          ? "block"
          : "none";
        break;

      case "show-grid-overlay":
        this._showGridOverlay = value !== null;
        this.gridOverlayLayer.style.display = this._showGridOverlay
          ? "block"
          : "none";
        break;

      case "show-terminator-overlay":
        this._showTerminatorOverlay = value !== null;
        this.terminatorOverlayLayer.style.display = this._showTerminatorOverlay
          ? "block"
          : "none";
        break;

      case "show-clock-overlay":
        this._showClockOverlay = value !== null;
        this.clockOverlayLayer.style.display = this._showClockOverlay
          ? "block"
          : "none";
        break;

      case "update-interval": {
        const parsed = Number(value);

        this._updateInterval =
          Number.isFinite(parsed) && parsed > 0 ? parsed : 250;
        this.start();
        break;
      }

      case "src":
        this._src = value ?? "";
        break;
    }

    void this.render();
  }

  private updateCursorVisibility(): void {
    this.svg.classList.toggle("cursor-clock-active", this._showCursorClock);
  }

  private onTimeChanged() {
    this.pinnedClocksLastUmi = undefined;
    this.cursorClockLastUmi = undefined;
    this.terminatorLastUmi = undefined;
  }

  get locations(): UmiLocation[] {
    return Array.from(this.querySelectorAll("umi-location"));
  }

  addLocation(label: string, latitude: number, longitude: number): UmiLocation {
    const location = document.createElement("umi-location") as UmiLocation;

    location.label = label;
    location.latitude = latitude;
    location.longitude = longitude;

    this.pinnedClocksLastUmi = undefined;
    this.append(location);

    return location;
  }

  private getCurrentTime(): UmiTime {
    const currentTime =
      this._live || !this._value ? new Date() : new Date(this._value);

    currentTime.setUTCMinutes(currentTime.getUTCMinutes() + this._offset * 4);
    return new UmiTime(currentTime);
  }

  private installPointerHandlers(): void {
    this.svg.addEventListener("pointermove", (e) => {
      if (window.matchMedia("(pointer:fine)").matches) {
        const pos = this.svgPointToLatLon(e);

        this.cursorLatitude = pos.latitude;
        this.cursorLongitude = pos.longitude;

        this.updateCursorClock(this.getCurrentTime());

        this.dispatchEvent(
          new CustomEvent("umi-location-hover", {
            detail: pos,
          }),
        );
      }
    });

    this.svg.addEventListener("click", (e) => {
      const pos = this.svgPointToLatLon(e);

      this.cursorLatitude = pos.latitude;
      this.cursorLongitude = pos.longitude;

      this.render();
    });
  }

  private svgPointToLatLon(e: PointerEvent | MouseEvent) {
    const rect = this.svg.getBoundingClientRect();

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const viewBox = this.svg.viewBox.baseVal;

    return mercatorInverse(
      x * viewBox.width,
      y * viewBox.height,
      viewBox.width,
      viewBox.height,
    );
  }

  start(): void {
    this.stop();

    if (!this._live) return;

    this.timer = window.setInterval(() => this.render(), this._updateInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async render(): Promise<void> {
    const umiTime = this.getCurrentTime();

    await this.renderMap();

    if (this.latitudeGridDirty) {
      this.renderLatitudeGrid();
      this.latitudeGridDirty = false;
    }

    if (this.longitudeGridDirty) {
      this.renderLongitudeGrid();
      this.longitudeGridDirty = false;
    }

    if (
      this.terminatorLastUmi === undefined ||
      umiTime.umi != this.terminatorLastUmi
    ) {
      if (this._showTerminator) {
        this.renderTerminator(umiTime);
      } else {
        this.terminatorLayer.replaceChildren();
      }
      this.terminatorLastUmi = umiTime.umi;
    }

    // Render pinned clocks if needed; either they have never been rendered or a minute has passed since the last refresh
    if (
      this.pinnedClocksLastUmi === undefined ||
      umiTime.umi != this.pinnedClocksLastUmi
    ) {
      this.pinnedClockLayer.replaceChildren();

      if (this._showPinnedClocks) {
        this.renderPinnedClocks(umiTime);
      }

      this.pinnedClocksLastUmi = umiTime.umi;
    }

    if (
      this.cursorClockLastUmi === undefined ||
      umiTime.umi != this.cursorClockLastUmi
    ) {
      if (this._showCursorClock) {
        this.updateCursorClock(umiTime);
      }
      this.cursorClockLastUmi = umiTime.umi;
    }
  }

  private async renderMap(): Promise<void> {
    const targetKey = this._src || DEFAULT_MAP_KEY;

    if (this.loadedMapSrc === targetKey) {
      return;
    }

    try {
      // Use the bundled SVG string if no custom `src` URL was provided
      const svgText = this._src ? await loadMapSvg(this._src) : defaultMapSvg;

      const parser = new DOMParser();
      const svgDocument = parser.parseFromString(svgText, "image/svg+xml");
      const sourceSvg = svgDocument.documentElement;
      const importedNodes = Array.from(sourceSvg.childNodes).map((node) =>
        document.importNode(node, true),
      );

      this.mapContentLayer.replaceChildren(...importedNodes);
      this.loadedMapSrc = targetKey;

      this.updateCursorVisibility();
    } catch (error) {
      console.error("Unable to load world map SVG", error);
    }
  }

  private renderTerminator(time: UmiTime): void {
    this.terminatorLayer.replaceChildren();

    const { points, borderOnTop } = computeTerminator(
      time.utc,
      VIEWBOX_WIDTH,
      VIEWBOX_HEIGHT,
    );

    if (points.length === 0) {
      return;
    }

    const path = document.createElementNS(SVG_NS, "path");
    const commands: string[] = [];
    const first = points[0];

    if (!first) {
      return;
    }

    commands.push(`M ${first.x} ${first.y}`);

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      if (!point) {
        return;
      }

      commands.push(`L ${point.x} ${point.y}`);
    }

    const last = points[points.length - 1];
    if (!last) {
      return;
    }

    if (borderOnTop) {
      commands.push(`L ${last.x} 0`, `L ${first.x} 0`);
    } else {
      commands.push(
        `L ${last.x} ${VIEWBOX_HEIGHT}`,
        `L ${first.x} ${VIEWBOX_HEIGHT}`,
      );
    }

    commands.push("Z");

    path.setAttribute("d", commands.join(" "));
    path.setAttribute("fill", `rgba(0,0,0,${TERMINATOR_OPACITY})`);
    path.setAttribute("pointer-events", "none");

    this.terminatorLayer.append(path);
  }

  private renderCursorClock(time: UmiTime): void {
    this.appendClock(this.cursorLatitude, this.cursorLongitude, time, {
      size: CURSOR_CLOCK_SIZE,
    });
  }

  private updateCursorClock(time: UmiTime): void {
    this.cursorClockLayer.replaceChildren();

    if (this._showCursorClock) {
      this.renderCursorClock(time);
    }

    this.cursorClockLastUmi = time.umi;
  }

  private renderPinnedClocks(time: UmiTime): void {
    for (const location of this.locations) {
      this.appendClock(location.latitude, location.longitude, time, {
        size: PINNED_CLOCK_SIZE,
        label: location.label,
        selected: location === this.selectedLocation,
      });
    }
  }

  private appendClock(
    latitude: number,
    longitude: number,
    time: UmiTime,
    options: {
      size: number;
      label?: string;
      selected?: boolean;
    },
  ): void {
    const point = mercatorProject(
      latitude,
      longitude,
      VIEWBOX_WIDTH,
      VIEWBOX_HEIGHT,
    );

    const foreignObject = document.createElementNS(SVG_NS, "foreignObject");

    const displaySize = options.size;
    const renderSize = CLOCK_CANVAS_SCALE * displaySize;
    const halfSize = displaySize / 2;

    foreignObject.setAttribute("x", String(point.x - halfSize));
    foreignObject.setAttribute("y", String(point.y - halfSize));
    foreignObject.setAttribute("width", String(options.size));
    foreignObject.setAttribute("height", String(options.size));

    foreignObject.classList.add("clock");

    if (options.selected) {
      foreignObject.classList.add("selected");
    }

    const canvas = document.createElement("canvas");

    canvas.width = renderSize;
    canvas.height = renderSize;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;

    const context = canvas.getContext("2d");
    context?.scale(CLOCK_CANVAS_SCALE, CLOCK_CANVAS_SCALE);

    if (!context) {
      return;
    }

    renderWorldMapClock(context, {
      latitude,
      longitude,
      date: time.utc,
      width: displaySize,
      height: displaySize,
    });

    foreignObject.append(canvas);

    const targetLayer = options.label
      ? this.pinnedClockLayer
      : this.cursorClockLayer;

    if (options.label) {
      const label = document.createElementNS(SVG_NS, "text");

      label.textContent = options.label;
      label.setAttribute("x", String(point.x));
      label.setAttribute("y", String(point.y + halfSize + 12));
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-weight", "bold");

      targetLayer.append(label);
    }

    targetLayer.append(foreignObject);
  }

  private renderLatitudeGrid(): void {
    this.latitudeGridLayer.replaceChildren();

    if (!this._showLatitudeGrid) {
      return;
    }

    const lines = buildLatitudeLines(VIEWBOX_WIDTH, VIEWBOX_HEIGHT);

    for (const line of lines) {
      const gridLine = document.createElementNS(SVG_NS, "line");

      gridLine.setAttribute("x1", String(line.x1));
      gridLine.setAttribute("y1", String(line.y1));
      gridLine.setAttribute("x2", String(line.x2));
      gridLine.setAttribute("y2", String(line.y2));

      gridLine.setAttribute(
        "stroke",
        line.isMajor ? "rgba(127,127,127,0.85)" : "rgba(127,127,127,0.5)",
      );

      gridLine.setAttribute("stroke-width", line.isMajor ? "1.2" : "0.4");

      this.latitudeGridLayer.append(gridLine);

      const position = mercatorProject(
        line.value,
        0,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT,
      );

      this.latitudeGridLayer.append(
        this.createGridLabel(line.label, position.x + 4, position.y - 2),
      );
    }
  }

  private renderLongitudeGrid(): void {
    this.longitudeGridLayer.replaceChildren();

    if (!this._showLongitudeGrid) {
      return;
    }

    const lines = buildLongitudeLines(VIEWBOX_WIDTH, VIEWBOX_HEIGHT);

    for (const line of lines) {
      const gridLine = document.createElementNS(SVG_NS, "line");

      gridLine.setAttribute("x1", String(line.x1));
      gridLine.setAttribute("y1", String(line.y1));
      gridLine.setAttribute("x2", String(line.x2));
      gridLine.setAttribute("y2", String(line.y2));

      gridLine.setAttribute(
        "stroke",
        line.isMajor ? "rgba(127,127,127,0.85)" : "rgba(127,127,127,0.5)",
      );

      gridLine.setAttribute("stroke-width", line.isMajor ? "1.2" : "0.4");

      this.longitudeGridLayer.append(gridLine);

      const position = mercatorProject(
        0,
        line.value,
        VIEWBOX_WIDTH,
        VIEWBOX_HEIGHT,
      );

      const label = this.createGridLabel(
        line.label,
        position.x,
        position.y + 12,
      );

      label.setAttribute("text-anchor", "middle");

      this.longitudeGridLayer.append(label);
    }
  }

  private createGridLabel(text: string, x: number, y: number): SVGTextElement {
    const label = document.createElementNS(SVG_NS, "text");

    label.textContent = text;

    label.setAttribute("x", String(x));
    label.setAttribute("y", String(y));
    label.setAttribute("font-size", "14");
    label.setAttribute("fill", "rgba(63,63,63,0.9)");
    //    label.setAttribute("paint-order", "stroke");
    //    label.setAttribute("stroke", "white");
    //    label.setAttribute("stroke-width", "0.5");

    return label;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-world-map": UmiWorldMap;
  }
}
