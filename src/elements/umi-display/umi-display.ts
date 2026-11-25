import { UmiTime as UmiTimeCore } from "umi-time";
import { clampLongitude } from "../../shared/coordinates";

const SVG_NS = "http://www.w3.org/2000/svg" as const;
const UMI_SYMBOL_PATH = "M 153.7 39.4 A 76 76 0 1 1 46.3 39.4";

export type UmiDisplayAttribute =
  | "value"
  | "live"
  | "seconds"
  | "longitude"
  | "update-interval";

export class UmiDisplayElement extends HTMLElement {
  static get observedAttributes(): readonly UmiDisplayAttribute[] {
    return ["value", "live", "seconds", "longitude", "update-interval"];
  }

  public live = false;
  public showSeconds = false;
  public longitude: number | null = null;
  public updateInterval = 250;

  private rawValue: string | null = null;
  private parsedFixedDate: Date | null = null;
  private timer: number | null = null;

  private readonly shadow: ShadowRoot;
  private readonly timeEl: HTMLTimeElement;
  private readonly umiText: Text;
  private readonly secondsSpan: HTMLSpanElement;
  private readonly phaseSpan: HTMLSpanElement;

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: inline-flex;
        align-items: baseline;
        font-variant-numeric: tabular-nums;
      }
      time {
        display: inline-flex;
        align-items: baseline;
      }
      svg {
        width: 0.45em;
        height: 0.45em;
        min-width: 0.45em;
        min-height: 0.45em;
        align-self: flex-start;
        margin-top: 0.25em;
        margin-left: 0.04em;
        flex-shrink: 0;
      }
      span[hidden] {
        display: none;
      }
      .seconds {
        margin-left: 0.3em;
      }
      .day-phase {
        margin-left: 0.35em;
        opacity: 0.85;
      }
    `;

    this.timeEl = document.createElement("time");
    this.timeEl.setAttribute("part", "time");

    this.umiText = document.createTextNode("");

    const symbolSvg = document.createElementNS(SVG_NS, "svg");
    symbolSvg.setAttribute("part", "symbol");
    symbolSvg.setAttribute("viewBox", "0 0 200 200");
    symbolSvg.setAttribute("aria-hidden", "true");

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", UMI_SYMBOL_PATH);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "32");
    path.setAttribute("stroke-linecap", "butt");
    symbolSvg.appendChild(path);

    this.secondsSpan = document.createElement("span");
    this.secondsSpan.className = "seconds";
    this.secondsSpan.setAttribute("part", "seconds");
    this.secondsSpan.setAttribute("hidden", "");

    this.phaseSpan = document.createElement("span");
    this.phaseSpan.className = "day-phase";
    this.phaseSpan.setAttribute("part", "day-phase");
    this.phaseSpan.setAttribute("hidden", "");

    this.timeEl.append(
      this.umiText,
      symbolSvg,
      this.secondsSpan,
      this.phaseSpan,
    );
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

  public setLongitude(lon: number | null): void {
    if (lon === null) {
      this.longitude = null;
      this.removeAttribute("longitude");
      this.render();
      return;
    }
    const clampedLon = clampLongitude(lon);
    if (clampedLon !== null) {
      this.longitude = clampedLon;
      this.setAttribute("longitude", String(clampedLon));
      this.render();
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

    switch (name as UmiDisplayAttribute) {
      case "value":
        this.rawValue = newValue;
        this.parsedFixedDate = this.parseInputToDate(newValue);
        break;
      case "live":
        this.live = newValue !== null && newValue !== "false";
        if (this.live && this.isConnected) {
          this.start();
        } else {
          this.stop();
        }
        break;
      case "seconds":
        this.showSeconds = newValue !== null && newValue !== "false";
        break;
      case "longitude":
        this.longitude =
          newValue !== null ? clampLongitude(parseFloat(newValue)) : null;
        break;
      case "update-interval":
        if (newValue !== null) {
          const parsed = parseInt(newValue, 10);
          if (Number.isFinite(parsed) && parsed > 0) {
            this.updateInterval = parsed;
            if (this.live && this.isConnected) {
              this.start();
            }
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
      this.umiText.nodeValue = "Invalid time";
      this.timeEl.removeAttribute("datetime");
      this.secondsSpan.setAttribute("hidden", "");
      this.phaseSpan.setAttribute("hidden", "");
      return;
    }

    this.timeEl.setAttribute("datetime", target.utc.toISOString());
    this.umiText.nodeValue = target.format("uuu");

    if (this.showSeconds) {
      this.secondsSpan.textContent = `${target.format("sss")}s`;
      this.secondsSpan.removeAttribute("hidden");
    } else {
      this.secondsSpan.textContent = "";
      this.secondsSpan.setAttribute("hidden", "");
    }

    if (this.longitude !== null) {
      const localAngle = (((target.umi + this.longitude) % 360) + 360) % 360;
      const dayPhase = Math.floor(localAngle / 15);
      this.phaseSpan.textContent = `\u03A6${dayPhase}`;
      this.phaseSpan.removeAttribute("hidden");
    } else {
      this.phaseSpan.textContent = "";
      this.phaseSpan.setAttribute("hidden", "");
    }
  }

  private resolveCurrentUmiTime(): UmiTimeCore | null {
    const date =
      this.live || this.rawValue === null ? new Date() : this.parsedFixedDate;

    if (!date) return null;
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
    "umi-display": UmiDisplayElement;
  }
}
