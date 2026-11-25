// src/elements/umi-world-map/umi-world-map.ts
import defaultMapSvg from "./assets/mercator.svg";

const DEFAULT_MAP_KEY = "__default__";

import { UmiTime as UmiTimeCore } from "umi-time";
import "../umi-location";

import type { UmiLocationElement } from "../umi-location";
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

export class UmiWorldMapElement extends HTMLElement {
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

  value: string | null = null;
  offset: number = 0;
  live: boolean = false;
  dark: boolean = false;

  src: string | null = null;
  loadedMapSrc: string | null = null;

  showTerminator = false;
  showLatitudeGrid = false;
  showLongitudeGrid = false;
  showPinnedClocks = false;
  showCursorClock = false;
  showMapOverlay = false;
  showGridOverlay = false;
  showTerminatorOverlay = false;
  showClockOverlay = false;

  updateInterval = 250;

  cursorLatitude = 0;
  cursorLongitude = 0;

  selectedLocation: UmiLocationElement | null = null;

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

  public getMapOverlayLayer(): SVGGElement {
    return this.mapOverlayLayer;
  }

  public getGridOverlayLayer(): SVGGElement {
    return this.gridOverlayLayer;
  }

  public getTerminatorOverlayLayer(): SVGGElement {
    return this.terminatorOverlayLayer;
  }

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
    switch (name) {
      case "value":
        this.value = value;
        this.onTimeChanged();
        break;

      case "offset": {
        const parsed = Number(value);

        this.offset = Number.isFinite(parsed) ? parsed : 0;
        this.onTimeChanged();
        break;
      }

      case "live":
        this.live = value !== null;
        this.onTimeChanged();
        this.start();
        break;

      case "dark":
        this.dark = value !== null;
        break;

      case "show-terminator":
        this.showTerminator = value !== null;
        this.terminatorLastUmi = undefined;
        break;

      case "show-latitude-grid":
        this.showLatitudeGrid = value !== null;
        this.latitudeGridDirty = true;
        break;

      case "show-longitude-grid":
        this.showLongitudeGrid = value !== null;
        this.longitudeGridDirty = true;
        break;

      case "show-pinned-clocks":
        this.showPinnedClocks = value !== null;
        this.pinnedClocksLastUmi = undefined;
        break;

      case "show-cursor-clock":
        this.showCursorClock = value !== null;
        this.cursorClockLastUmi = undefined;
        this.updateCursorVisibility();
        break;

      case "show-map-overlay":
        this.showMapOverlay = value !== null;
        this.mapOverlayLayer.style.display = this.showMapOverlay
          ? "block"
          : "none";
        break;

      case "show-grid-overlay":
        this.showGridOverlay = value !== null;
        this.gridOverlayLayer.style.display = this.showGridOverlay
          ? "block"
          : "none";
        break;

      case "show-terminator-overlay":
        this.showTerminatorOverlay = value !== null;
        this.terminatorOverlayLayer.style.display = this.showTerminatorOverlay
          ? "block"
          : "none";
        break;

      case "show-clock-overlay":
        this.showClockOverlay = value !== null;
        this.clockOverlayLayer.style.display = this.showClockOverlay
          ? "block"
          : "none";
        break;

      case "update-interval": {
        const parsed = Number(value);

        this.updateInterval =
          Number.isFinite(parsed) && parsed > 0 ? parsed : 250;
        this.start();
        break;
      }

      case "src":
        this.src = value;
        break;
    }

    void this.render();
  }

  private updateCursorVisibility(): void {
    this.svg.classList.toggle("cursor-clock-active", this.showCursorClock);
  }

  private onTimeChanged() {
    this.pinnedClocksLastUmi = undefined;
    this.cursorClockLastUmi = undefined;
    this.terminatorLastUmi = undefined;
  }

  get locations(): UmiLocationElement[] {
    return Array.from(this.querySelectorAll("umi-location"));
  }

  addLocation(
    label: string,
    latitude: number,
    longitude: number,
  ): UmiLocationElement {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocationElement;

    location.label = label;
    location.latitude = latitude;
    location.longitude = longitude;

    this.pinnedClocksLastUmi = undefined;
    this.append(location);

    return location;
  }

  private getCurrentTime(): UmiTimeCore {
    const currentTime =
      this.live || !this.value ? new Date() : new Date(this.value);

    currentTime.setUTCMinutes(currentTime.getUTCMinutes() + this.offset * 4);
    return new UmiTimeCore(currentTime);
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

    if (!this.live) return;

    this.timer = window.setInterval(() => this.render(), this.updateInterval);
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
      if (this.showTerminator) {
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

      if (this.showPinnedClocks) {
        this.renderPinnedClocks(umiTime);
      }

      this.pinnedClocksLastUmi = umiTime.umi;
    }

    if (
      this.cursorClockLastUmi === undefined ||
      umiTime.umi != this.cursorClockLastUmi
    ) {
      if (this.showCursorClock) {
        this.updateCursorClock(umiTime);
      }
      this.cursorClockLastUmi = umiTime.umi;
    }
  }

  private async renderMap(): Promise<void> {
    const targetKey = this.src || DEFAULT_MAP_KEY;

    if (this.loadedMapSrc === targetKey) {
      return;
    }

    try {
      // Use the bundled SVG string if no custom `src` URL was provided
      const svgText = this.src ? await loadMapSvg(this.src) : defaultMapSvg;

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

  private renderTerminator(time: UmiTimeCore): void {
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

  private renderCursorClock(time: UmiTimeCore): void {
    this.appendClock(this.cursorLatitude, this.cursorLongitude, time, {
      size: CURSOR_CLOCK_SIZE,
    });
  }

  private updateCursorClock(time: UmiTimeCore): void {
    this.cursorClockLayer.replaceChildren();

    if (this.showCursorClock) {
      this.renderCursorClock(time);
    }

    this.cursorClockLastUmi = time.umi;
  }

  private renderPinnedClocks(time: UmiTimeCore): void {
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
    time: UmiTimeCore,
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

    if (!this.showLatitudeGrid) {
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

    if (!this.showLongitudeGrid) {
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
    "umi-world-map": UmiWorldMapElement;
  }
}
