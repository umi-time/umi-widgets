// src/elements/umi-location/umi-location.ts

import { clampLatitude } from "../../shared/coordinates";

/**
 * Supported attributes for the <umi-location> element.
 */
export type UmiLocationAttribute =
  | "label"
  | "latitude"
  | "longitude"
  | "color"
  | "timezone";

/**
 * Defines a geographic location for use by other Umi-Time components.
 *
 * This is a non-visual data element that supplies a label, coordinates,
 * and optional timezone or color information to parent components such
 * as maps, timelines, and other location-aware displays.
 *
 * @event umi-location-change Fired when any location attribute changes.
 */
export class UmiLocation extends HTMLElement {
  static get observedAttributes(): UmiLocationAttribute[] {
    return ["label", "latitude", "longitude", "color", "timezone"];
  }

  private _label = "";
  private _latitude = 0;
  private _longitude = 0;
  private _timezone = "";
  private _color = "";

  /** Display label for the location. */
  public get label(): string {
    return this._label;
  }

  public set label(value: string) {
    this._label = value;

    if (this.getAttribute("label") !== value) {
      this.setAttribute("label", value);
    }
  }

  /** Latitude in decimal degrees. */
  public get latitude(): number {
    return this._latitude;
  }

  public set latitude(value: number) {
    const clamped = clampLatitude(value);

    if (clamped === null) {
      return;
    }

    this._latitude = clamped;

    const attributeValue = String(clamped);

    if (this.getAttribute("latitude") !== attributeValue) {
      this.setAttribute("latitude", attributeValue);
    }
  }

  /** Longitude in decimal degrees. */
  public get longitude(): number {
    return this._longitude;
  }

  public set longitude(value: number) {
    this._longitude = value;

    const attributeValue = String(value);

    if (this.getAttribute("longitude") !== attributeValue) {
      this.setAttribute("longitude", attributeValue);
    }
  }

  /** Optional display color associated with the location. */
  public get color(): string {
    return this._color;
  }

  public set color(value: string) {
    this._color = value;

    if (this.getAttribute("color") !== value) {
      this.setAttribute("color", value);
    }
  }

  /** IANA timezone identifier associated with the location. */
  public get timezone(): string {
    return this._timezone;
  }

  public set timezone(value: string) {
    this._timezone = value;

    if (this.getAttribute("timezone") !== value) {
      this.setAttribute("timezone", value);
    }
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    value: string | null,
  ): void {
    switch (name) {
      case "label":
        this._label = value ?? "";
        break;

      case "latitude": {
        const lat = clampLatitude(Number(value));

        if (lat !== null) {
          this._latitude = lat;
        }

        break;
      }

      case "longitude": {
        // Longitude is not clamped to allow values outside the typical -180 to 180 range
        const lon = Number(value);

        if (Number.isFinite(lon)) {
          this._longitude = lon;
        }

        break;
      }

      case "color":
        this._color = value ?? "";
        break;

      case "timezone":
        this._timezone = value ?? "";
        break;
    }
    this.dispatchEvent(
      new CustomEvent("umi-location-change", {
        bubbles: true,
        composed: true,
      }),
    );
  }
}

if (!customElements.get("umi-location")) {
  customElements.define("umi-location", UmiLocation);
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-location": UmiLocation;
  }
}
