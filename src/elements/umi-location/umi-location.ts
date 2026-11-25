// src/elements/umi-location/umi-location.ts

import { clampLatitude } from "../../shared/coordinates";

export class UmiLocationElement extends HTMLElement {
  static get observedAttributes() {
    return ["label", "latitude", "longitude", "color", "timezone"];
  }

  private _label = "";
  private _latitude = 0;
  private _longitude = 0;
  private _timezone = "";
  private _color = "";

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    this._label = value;

    if (this.getAttribute("label") !== value) {
      this.setAttribute("label", value);
    }
  }

  get latitude(): number {
    return this._latitude;
  }

  set latitude(value: number) {
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

  get longitude(): number {
    return this._longitude;
  }

  set longitude(value: number) {
    this._longitude = value;

    const attributeValue = String(value);

    if (this.getAttribute("longitude") !== attributeValue) {
      this.setAttribute("longitude", attributeValue);
    }
  }

  get color(): string {
    return this._color;
  }

  set color(value: string) {
    this._color = value;

    if (this.getAttribute("color") !== value) {
      this.setAttribute("color", value);
    }
  }

  get timezone(): string {
    return this._timezone;
  }

  set timezone(value: string) {
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
  customElements.define("umi-location", UmiLocationElement);
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-location": UmiLocationElement;
  }
}
