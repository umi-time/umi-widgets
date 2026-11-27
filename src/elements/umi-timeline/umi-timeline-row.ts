import { clampLatitude, clampLongitude } from "../../shared/coordinates";

/**
 * Supported attributes for the <umi-timeline-row> element.
 */
export type UmiTimelineRowAttribute = "label" | "latitude" | "longitude";

/**
 * Defines a location entry within a <umi-timeline> element.
 *
 * This is a non-visual data element that supplies the label and geographic
 * coordinates for a timeline row rendered by the parent timeline.
 * @event umi-row-change Fired when the row definition changes.
 */
export class UmiTimelineRow extends HTMLElement {
  static get observedAttributes(): readonly UmiTimelineRowAttribute[] {
    return ["label", "latitude", "longitude"];
  }

  private _label = "";
  private _latitude = 0;
  private _longitude = 0;

  /** Display label for the timeline row. */
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
    const clamped = clampLongitude(value);

    if (clamped === null) {
      return;
    }

    this._longitude = clamped;

    const attributeValue = String(clamped);

    if (this.getAttribute("longitude") !== attributeValue) {
      this.setAttribute("longitude", attributeValue);
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue) {
      return;
    }

    switch (name as UmiTimelineRowAttribute) {
      case "label":
        this._label = newValue ?? "";
        break;

      case "latitude": {
        const clamped = clampLatitude(Number(newValue));

        if (clamped !== null) {
          this._latitude = clamped;
        }

        break;
      }

      case "longitude": {
        const clamped = clampLongitude(Number(newValue));

        if (clamped !== null) {
          this._longitude = clamped;
        }

        break;
      }
    }

    this.dispatchEvent(
      new CustomEvent("umi-row-change", {
        bubbles: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-timeline-row": UmiTimelineRow;
  }
}
