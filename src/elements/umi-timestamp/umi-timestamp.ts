import { UmiTime } from "umi-time";
import { clampLongitude } from "../../shared/coordinates";

/**
 * Supported attributes for the <umi-timestamp> element.
 */
export type UmiTimestampAttribute =
  | "value"
  | "format"
  | "live"
  | "longitude"
  | "update-interval";

/**
 * Displays a Umi-Time value in one of several formats.
 *
 * The element can display a fixed value or update live as time advances,
 * and can optionally apply local context based on longitude.
 */
export class UmiTimestamp extends HTMLElement {
  static get observedAttributes(): readonly UmiTimestampAttribute[] {
    return ["value", "format", "live", "longitude", "update-interval"];
  }

  private _value = "";
  private _format = "uuu:sss";
  private _live = false;
  private _longitude: number | null = null;
  private _updateInterval = 250;

  private parsedFixedDate: Date | null = null;
  private timer: number | null = null;

  private readonly shadow: ShadowRoot;
  private readonly timeEl: HTMLTimeElement;

  /** Umi-Time value to display. */
  public get value(): string {
    return this._value;
  }

  public set value(value: string) {
    this._value = value;

    if (this.getAttribute("value") !== value) {
      this.setAttribute("value", value);
    }
  }

  /** Format string used to render the Umi-Time value. */
  public get format(): string {
    return this._format;
  }

  public set format(value: string) {
    this._format = value;

    if (this.getAttribute("format") !== value) {
      this.setAttribute("format", value);
    }
  }

  /** Enables automatic updating as time advances. */
  public get live(): boolean {
    return this._live;
  }

  public set live(value: boolean) {
    this._live = value;

    if (this.hasAttribute("live") !== value) {
      this.toggleAttribute("live", value);
    }
  }

  /**
   * Optional longitude used to provide local context for the displayed
   * Umi-Time value.
   */
  public get longitude(): number | null {
    return this._longitude;
  }

  public set longitude(value: number | null) {
    this._longitude = value;

    if (value === null) {
      this.removeAttribute("longitude");
    } else {
      const attributeValue = String(value);

      if (this.getAttribute("longitude") !== attributeValue) {
        this.setAttribute("longitude", attributeValue);
      }
    }
  }

  /** Refresh interval in milliseconds when live updating is enabled. */
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

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: inline;
        font-variant-numeric: tabular-nums;
      }
    `;

    this.timeEl = document.createElement("time");
    this.timeEl.setAttribute("part", "time");

    this.shadow.append(style, this.timeEl);
  }

  /**
   * Updates the longitude used to provide local context for the displayed
   * Umi-Time value.
   *
   * @param lon Longitude in decimal degrees.
   */
  public setLongitude(lon: number): void {
    const clampedLon = clampLongitude(lon);
    if (clampedLon !== null) {
      this.setAttribute("longitude", String(clampedLon));
    }
  }

  connectedCallback(): void {
    this.render();
    if (this._live) {
      this.start();
    }
  }

  disconnectedCallback(): void {
    this.stop();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue) return;

    switch (name as UmiTimestampAttribute) {
      case "value":
        this._value = newValue ?? "";
        this.parsedFixedDate = this.parseInputToDate(newValue);
        break;
      case "format":
        this._format = newValue || "uuu:sss";
        break;
      case "live":
        this._live = newValue !== null && newValue !== "false";
        if (this._live && this.isConnected) {
          this.start();
        } else {
          this.stop();
        }
        break;
      case "longitude":
        {
          const parsed = newValue !== null ? parseFloat(newValue) : NaN;

          if (Number.isFinite(parsed)) {
            this._longitude = clampLongitude(parsed);
          } else {
            this._longitude = null;
            console.warn("<umi-timestamp>: invalid longitude attribute:", newValue);
          }
        }
        break;
      case "update-interval":
        {
          const parsed = newValue !== null ? parseInt(newValue, 10) : NaN;

          if (Number.isFinite(parsed) && parsed > 0) {
            this._updateInterval = parsed;
          } else {
            console.warn(
              "<umi-timestamp>: invalid update-interval attribute:",
              newValue,
            );
          }
        }
        break;
    }

    this.render();
  }

  /**
   * Starts automatic updates when live mode is enabled.
   */
  public start(): void {
    this.stop();
    this.render();
    this.timer = window.setInterval(() => {
      this.render();
    }, this._updateInterval);
  }

  /**
   * Stops automatic updates.
   */
  public stop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private render(): void {
    const target = this.resolveCurrentUmiTime();
    if (!target) {
      this.timeEl.textContent = "Invalid time";
      this.timeEl.removeAttribute("datetime");
      return;
    }

    this.timeEl.textContent = target.format(this._format);
    this.timeEl.setAttribute("datetime", target.utc.toISOString());
  }

  private resolveCurrentUmiTime(): UmiTime | null {
    const date =
      this._live || this._value === "" ? new Date() : this.parsedFixedDate;

    if (!date) return null;

    if (this._longitude !== null) {
      return new UmiTime(date, undefined, {
        value: this._longitude,
        uncertainty: 0,
      });
    }

    return new UmiTime(date);
  }

  private parseInputToDate(raw: string | null): Date | null {
    if (!raw || raw.trim() === "") return null;

    const trimmed = raw.trim();

    if (!trimmed.includes("U") && !/^\d{3}:\d{3}$/.test(trimmed)) {
      const asDate = new Date(trimmed);
      if (!Number.isNaN(asDate.getTime())) {
        return asDate;
      }
    }

    try {
      return UmiTime.parse(trimmed).utc;
    } catch {
      return null;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-timestamp": UmiTimestamp;
  }
}
