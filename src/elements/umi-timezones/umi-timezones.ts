// src/elements/umi-timezones/umi-timezones.ts

import { UmiWorldMap } from "../umi-world-map/umi-world-map";
import {
  GeoJsonFeatureCollection,
  renderTimeZones,
} from "./world-map-timezones";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Supported attributes for the <umi-timezones> element.
 */
export type UmiTimezonesAttribute = "src";

function createTimezoneLayer(
  gridOverlayLayer: SVGGElement,
): SVGGElement {
  let layer = gridOverlayLayer.querySelector(
    "#timezone-layer",
  ) as SVGGElement | null;

  if (layer) {
    return layer;
  }

  layer = document.createElementNS(SVG_NS, "g");
  layer.id = "timezone-layer";
  gridOverlayLayer.append(layer);

  return layer;
}

/**
 * Displays timezone boundary overlays on a parent <umi-world-map> element.
 *
 * Timezone data can be loaded from a bundled dataset or from a custom
 * GeoJSON source specified by the src attribute.
 */
export class UmiTimezones extends HTMLElement {
  static get observedAttributes(): readonly UmiTimezonesAttribute[] {
    return ["src"];
  }

  private _src = "";
  private _data: GeoJsonFeatureCollection | null = null;

  /**
 * URL of the GeoJSON timezone dataset.
 *
 * When omitted, the bundled timezone dataset is used.
 */
  public get src(): string {
    return this._src;
  }

  public set src(value: string) {
    this._src = value;
    this._data = null;

    if (this.getAttribute("src") !== value) {
      this.setAttribute("src", value);
    }
  }

  private get data(): GeoJsonFeatureCollection | null {
    return this._data;
  }

  private set data(value: GeoJsonFeatureCollection | null) {
    this._data = value;
    if (this.isConnected) {
      void this.render();
    }
  }

  connectedCallback(): void {
    void this.render();
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    value: string | null,
  ): void {
    if (_oldValue === value) {
      return;
    }

    if (name === "src") {
      this._src = value ?? "";
      this._data = null;
    }

    if (this.isConnected) {
      void this.render();
    }
  }

  private async render(): Promise<void> {
    const worldMap = this.closest(
      "umi-world-map",
    ) as UmiWorldMap | null;

    if (!worldMap) {
      return;
    }

    const overlayLayer = createTimezoneLayer(
      worldMap.getGridOverlayLayer(),
    );

    const viewBox = worldMap.querySelector("svg")?.viewBox.baseVal;
    const width = viewBox?.width ?? 1652.4702;
    const height = viewBox?.height ?? 1220.6385;

    // Priority: 1) JS .data property -> 2) src URL attribute -> 3) bundled default
    const source = this._data ?? (this._src || undefined);

    await renderTimeZones(overlayLayer, source, width, height);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-timezones": UmiTimezones;
  }
}
