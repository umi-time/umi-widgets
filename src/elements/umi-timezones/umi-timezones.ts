// src/elements/umi-timezones/umi-timezones.ts

import { UmiWorldMapElement } from "../umi-world-map/umi-world-map";
import {
  GeoJsonFeatureCollection,
  renderTimeZones,
} from "./world-map-timezones";

const SVG_NS = "http://www.w3.org/2000/svg";

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

export class UmiTimezonesElement extends HTMLElement {
  static get observedAttributes(): readonly UmiTimezonesAttribute[] {
    return ["src"];
  }

  private _src = "";
  private _data: GeoJsonFeatureCollection | null = null;

  get src(): string {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    this._data = null;

    if (this.getAttribute("src") !== value) {
      this.setAttribute("src", value);
    }
  }

  get data(): GeoJsonFeatureCollection | null {
    return this._data;
  }

  set data(value: GeoJsonFeatureCollection | null) {
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
    ) as UmiWorldMapElement | null;

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
    "umi-timezones": UmiTimezonesElement;
  }
}
