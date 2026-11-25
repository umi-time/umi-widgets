import { UmiTime as UmiTimeCore } from "umi-time";
import { clampLongitude } from "../../shared/coordinates";

export type UmiTimeAttribute =
  | "value"
  | "format"
  | "live"
  | "longitude"
  | "update-interval";

export class UmiTimeElement extends HTMLElement {
  static get observedAttributes(): readonly UmiTimeAttribute[] {
    return ["value", "format", "live", "longitude", "update-interval"];
  }

  public format = "uuu:sss";
  public live = false;
  public longitude: number | null = null;
  public updateInterval = 250;

  private rawValue: string | null = null;
  private parsedFixedDate: Date | null = null;
  private timer: number | null = null;

  private readonly shadow: ShadowRoot;
  private readonly timeEl: HTMLTimeElement;

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

  get value(): string | null {
    return this.rawValue;
  }

  set value(val: string | null) {
    if (val === null) {
      this.removeAttribute("value");
    } else {
      this.setAttribute("value", val);
    }
  }

  public setLongitude(lon: number): void {
    const clampedLon = clampLongitude(lon);
    if (clampedLon !== null) {
      this.setAttribute("longitude", String(clampedLon));
    }
  }

  connectedCallback(): void {
    this.render();
    if (this.live) {
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

    switch (name as UmiTimeAttribute) {
      case "value":
        this.rawValue = newValue;
        this.parsedFixedDate = this.parseInputToDate(newValue);
        break;
      case "format":
        this.format = newValue || "uuu:sss";
        break;
      case "live":
        this.live = newValue !== null && newValue !== "false";
        if (this.live && this.isConnected) {
          this.start();
        } else {
          this.stop();
        }
        break;
      case "longitude":
        {
          const parsed = newValue !== null ? parseFloat(newValue) : NaN;

          if (Number.isFinite(parsed)) {
            this.longitude = clampLongitude(parsed);
          } else {
            this.longitude = null;
            console.warn("<umi-time>: invalid longitude attribute:", newValue);
          }
        }
        break;
      case "update-interval":
        {
          const parsed = newValue !== null ? parseInt(newValue, 10) : NaN;

          if (Number.isFinite(parsed) && parsed > 0) {
            this.updateInterval = parsed;
          } else {
            console.warn(
              "<umi-time>: invalid update-interval attribute:",
              newValue,
            );
          }
        }
        break;
    }

    this.render();
  }

  public start(): void {
    this.stop();
    this.render();
    this.timer = window.setInterval(() => {
      this.render();
    }, this.updateInterval);
  }

  public stop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  public render(): void {
    const target = this.resolveCurrentUmiTime();
    if (!target) {
      this.timeEl.textContent = "Invalid time";
      this.timeEl.removeAttribute("datetime");
      return;
    }

    this.timeEl.textContent = target.format(this.format);
    this.timeEl.setAttribute("datetime", target.utc.toISOString());
  }

  private resolveCurrentUmiTime(): UmiTimeCore | null {
    const date =
      this.live || this.rawValue === null ? new Date() : this.parsedFixedDate;

    if (!date) return null;

    if (this.longitude !== null) {
      return new UmiTimeCore(date, undefined, {
        value: this.longitude,
        uncertainty: 0,
      });
    }

    return new UmiTimeCore(date);
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
      return UmiTimeCore.parse(trimmed).utc;
    } catch {
      return null;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-time": UmiTimeElement;
  }
}
