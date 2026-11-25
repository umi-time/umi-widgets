import { clampLatitude, clampLongitude } from "../../shared/coordinates";

export type UmiTimelineRowAttribute = "label" | "latitude" | "longitude";

export class UmiTimelineRowElement extends HTMLElement {
  static get observedAttributes(): readonly UmiTimelineRowAttribute[] {
    return ["label", "latitude", "longitude"];
  }

  private _label = "";
  private _latitude = 0;
  private _longitude = 0;

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    this._label = value;
  }

  get latitude(): number {
    return this._latitude;
  }

  set latitude(value: number) {
    this._latitude = value;
  }

  get longitude(): number {
    return this._longitude;
  }

  set longitude(value: number) {
    this._longitude = value;
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue) return;

    switch (name) {
      case "label":
        this.label = newValue ?? "";
        break;

      case "latitude": {
        if (newValue === null) {
          this.latitude = 0;
          break;
        }

        const clamped = clampLatitude(parseFloat(newValue));

        if (clamped !== null) {
          this.latitude = clamped;
        }
        break;
      }

      case "longitude": {
        if (newValue === null) {
          this.longitude = 0;
          break;
        }

        const clamped = clampLongitude(parseFloat(newValue));

        if (clamped !== null) {
          this.longitude = clamped;
        }

        break;
      }
    }

    this.dispatchEvent(new CustomEvent("umi-row-change", { bubbles: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-timeline-row": UmiTimelineRowElement;
  }
}
