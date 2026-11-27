import { UmiTime } from "umi-time";
import { buildSolarLinearGradient } from "../../shared/colors";
import { clampLatitude, clampLongitude } from "../../shared/coordinates";
import { UmiReadout } from "../umi-readout";
import { UmiTimelineRow } from "./umi-timeline-row";

/**
 * Supported attributes for the <umi-timeline> element.
 */
export type UmiTimelineAttribute =
  | "value"
  | "live"
  | "show-phases"
  | "dark"
  | "update-interval";

/**
 * Snapshot of a timeline row's computed state.
 *
 * Contains the row's location information together with the calculated
 * daylight phase and sunrise/sunset values for the current timeline time.
 */
export interface UmiTimelineRowSnapshot {
  /** Display label for the location. */
  label: string;

  /** Latitude in decimal degrees. */
  latitude: number;

  /** Longitude in decimal degrees. */
  longitude: number;

  /** Computed day phase value used for timeline rendering. */
  dayPhase: number;

  /** Sunrise time in umi, if a sunrise occurs on the selected day. */
  sunriseUmi: number | null;

  /** Sunset time in umi, if a sunset occurs on the selected day. */
  sunsetUmi: number | null;
}

/**
 * Event detail for the "umi-timeline-select" event.
 *
 * Contains the selected Umi-Time value and the computed state of all
 * timeline rows at the selected moment.
 */
export interface UmiTimelineSelectDetail {
  /** The selected Umi-Time instance. */
  umiTime: UmiTime;

  /** The selected umi value. */
  umi: number;

  /** Snapshot data for all rows in the timeline. */
  rows: UmiTimelineRowSnapshot[];
}

function wrap360(value: number): number {
  return ((value % 360) + 360) % 360;
}

const DAY_PHASE_WIDTH = 15;

/**
 * Displays a collection of locations on a shared Umi-Time timeline.
 *
 * The timeline can update live, visualize daylight phases, and emit
 * selection events that provide Umi-Time and row snapshot data for the
 * selected moment.
 * @event umi-select Fired while the timeline is being scrubbed.
 * detail: UmiTimelineSelectDetail
 */
export class UmiTimeline extends HTMLElement {
  static get observedAttributes(): readonly UmiTimelineAttribute[] {
    return ["value", "live", "show-phases", "dark", "update-interval"];
  }

  private baseDate: Date = new Date();
  private scrubbedUmi: number | null = null;
  private isDragging = false;
  private timer: number | undefined;
  private observer: MutationObserver;

  private readonly shadow: ShadowRoot;
  private readonly container: HTMLDivElement;
  private readonly headerDisplayEl: UmiReadout;
  private readonly headerUtcEl: HTMLSpanElement;
  private readonly dateInput: HTMLInputElement;
  private readonly liveBtn: HTMLButtonElement;
  private readonly axisEl: HTMLDivElement;
  private readonly rowsHost: HTMLDivElement;
  private readonly playheadEl: HTMLDivElement;
  private readonly playheadBadgeEl: HTMLSpanElement;

  private _live = false;
  private _showPhases = false;
  private _dark = false;
  private _updateInterval = 1000;

  public get value(): string {
    return this.baseDate.toISOString();
  }

  public set value(value: string) {
    if (this.getAttribute("value") !== value) {
      this.setAttribute("value", value);
    }
  }

  /** Enables automatic updates as time advances. */
  public get live(): boolean {
    return this._live;
  }

  public set live(value: boolean) {
    this._live = value;

    if (this.hasAttribute("live") !== value) {
      this.toggleAttribute("live", value);
    }
  }

  /** Displays daylight phase information for each timeline row. */
  public get showPhases(): boolean {
    return this._showPhases;
  }

  public set showPhases(value: boolean) {
    this._showPhases = value;

    if (this.hasAttribute("show-phases") !== value) {
      this.toggleAttribute("show-phases", value);
    }
  }

  /** Enables the dark color scheme when true. */
  public get dark(): boolean {
    return this._dark;
  }

  public set dark(value: boolean) {
    this._dark = value;

    if (this.hasAttribute("dark") !== value) {
      this.toggleAttribute("dark", value);
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
        display: block;
        font-family: system-ui, -apple-system, sans-serif;
        font-variant-numeric: tabular-nums;
        --bg: #ffffff;
        --surface: #f8fafc;
        --border: #e2e8f0;
        --text: #0f172a;
        --muted: #64748b;
        --playhead: #ef4444;
      }
      .container.dark {
        --bg: #0b0f19;
        --surface: #111827;
        --border: #1e293b;
        --text: #f8fafc;
        --muted: #94a3b8;
        --playhead: #f87171;
      }
      .container {
        background: var(--bg);
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1rem;
        user-select: none;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .header-title {
        display: flex;
        align-items: baseline;
        gap: 0.75rem;
      }
      .umi-readout {
        font-size: 1.25rem;
        font-weight: 700;
      }
      .utc-readout {
        font-size: 0.85rem;
        color: var(--muted);
      }
      .controls {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .date-controls {
        display: inline-flex;
        align-items: center;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 2px;
        gap: 2px;
      }
      .step-btn {
        font-size: 0.74rem;
        font-weight: 600;
        padding: 0.2rem 0.45rem;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: var(--text);
        cursor: pointer;
      }
      .step-btn:hover {
        background: var(--border);
      }
      .date-input {
        font-family: inherit;
        font-size: 0.78rem;
        color: var(--text);
        background: transparent;
        border: none;
        padding: 0.15rem 0.35rem;
        outline: none;
      }
      .container.dark .date-input {
        color-scheme: dark;
      }
      .live-btn {
        font-size: 0.78rem;
        font-weight: 600;
        padding: 0.3rem 0.7rem;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--muted);
        cursor: pointer;
      }
      .live-btn.active {
        background: #10b981;
        border-color: #10b981;
        color: #ffffff;
      }
      .timeline-body {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 0.5rem 0.75rem;
        align-items: center;
        position: relative;
      }
      .axis-track {
        position: relative;
        height: 20px;
        font-size: 0.72rem;
        color: var(--muted);
      }
      .axis-tick {
        position: absolute;
        transform: translateX(-50%);
        top: 0;
      }
      .axis-tick:first-child {
        transform: translateX(0);
      }
      .axis-tick:last-child {
        transform: translateX(-100%);
      }
      .tracks-wrapper {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        position: relative;
      }
      .row {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 0.75rem;
        align-items: center;
      }
      .row-meta {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .row-label-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.35rem;
      }
      .row-label {
        font-size: 0.88rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .row-phase-badge {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.1rem 0.4rem;
        border-radius: 6px;
        background: var(--surface);
        border: 1px solid var(--border);
        flex-shrink: 0;
      }
      .row-coords {
        font-size: 0.72rem;
        color: var(--muted);
      }
      .track {
        position: relative;
        height: 34px;
        border-radius: 8px;
        overflow: hidden;
        cursor: ew-resize;
        border: 1px solid rgba(15, 23, 42, 0.15);
      }
      .phase-grid {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .phase-cell {
        position: absolute;
        top: 0;
        bottom: 0;
        border-left: 1px solid rgba(255, 255, 255, 0.25);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-bottom: 2px;
        font-size: 0.62rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75);
        overflow: hidden;
      }
      .sun-marker {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #ffffff;
        box-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
        pointer-events: none;
      }
      .playhead-overlay {
        position: absolute;
        top: 0;
        bottom: 0;
        left: calc(140px + 0.75rem);
        right: 0;
        pointer-events: none;
      }
      .playhead {
        position: absolute;
        top: -4px;
        bottom: -4px;
        width: 2px;
        background: var(--playhead);
        transform: translateX(-50%);
      }
      .playhead-badge {
        position: absolute;
        top: -18px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--playhead);
        color: #ffffff;
        font-size: 0.68rem;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 4px;
        white-space: nowrap;
      }
      slot {
        display: none;
      }
    `;

    this.container = document.createElement("div");
    this.container.className = "container";

    // Header
    const header = document.createElement("div");
    header.className = "header";

    const titleGroup = document.createElement("div");
    titleGroup.className = "header-title";

    // Proper human-friendly display readout: e.g. "301ᵘ 000s"
    this.headerDisplayEl = document.createElement("umi-readout") as UmiReadout;

    this.headerDisplayEl.className = "umi-readout";
    this.headerDisplayEl.setAttribute("seconds", "");
    this.headerUtcEl = document.createElement("span");
    this.headerUtcEl.className = "utc-readout";

    titleGroup.append(this.headerDisplayEl, this.headerUtcEl);
    // Controls: Date shifter + Live button
    const controls = document.createElement("div");
    controls.className = "controls";

    const dateControls = document.createElement("div");
    dateControls.className = "date-controls";

    const backMonthBtn = this.makeStepBtn("−30d", "Back 30 days", -30);
    const backDayBtn = this.makeStepBtn("−1d", "Previous day", -1);
    this.dateInput = document.createElement("input");
    this.dateInput.type = "date";
    this.dateInput.className = "date-input";
    this.dateInput.ariaLabel = "UTC Date";
    this.dateInput.addEventListener("change", () => {
      if (!this.dateInput.value) return;
      const parts = this.dateInput.value.split("-").map(Number);
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      if (year !== undefined && month !== undefined && day !== undefined) {
        const current = this.resolveTargetUmiTime().utc;
        const nextDate = new Date(
          Date.UTC(
            year,
            month - 1,
            day,
            current.getUTCHours(),
            current.getUTCMinutes(),
            current.getUTCSeconds(),
            current.getUTCMilliseconds(),
          ),
        );
        this.setBaseDate(nextDate);
      }
    });
    const fwdDayBtn = this.makeStepBtn("+1d", "Next day", 1);
    const fwdMonthBtn = this.makeStepBtn("+30d", "Forward 30 days", 30);
    dateControls.append(
      backMonthBtn,
      backDayBtn,
      this.dateInput,
      fwdDayBtn,
      fwdMonthBtn,
    );
    this.liveBtn = document.createElement("button");
    this.liveBtn.type = "button";
    this.liveBtn.className = "live-btn";
    this.liveBtn.textContent = "● Live";
    this.liveBtn.addEventListener("click", () => this.resetToLive());
    controls.append(dateControls, this.liveBtn);
    header.append(titleGroup, controls);
    // Axis + Tracks layout
    const body = document.createElement("div");
    body.className = "timeline-body";
    const axisSpacer = document.createElement("div");
    this.axisEl = document.createElement("div");
    this.axisEl.className = "axis-track";
    const axisTicks = Array.of(0, 60, 120, 180, 240, 300, 360);
    for (const tick of axisTicks) {
      const span = document.createElement("span");
      span.className = "axis-tick";
      span.style.left = `${(tick / 360) * 100}%`;
      span.textContent = `${String(tick).padStart(3, "0")}ᵘ`;
      this.axisEl.appendChild(span);
    }
    this.rowsHost = document.createElement("div");
    this.rowsHost.className = "tracks-wrapper";
    const playheadOverlay = document.createElement("div");
    playheadOverlay.className = "playhead-overlay";
    this.playheadEl = document.createElement("div");
    this.playheadEl.className = "playhead";
    this.playheadBadgeEl = document.createElement("span");
    this.playheadBadgeEl.className = "playhead-badge";
    this.playheadEl.appendChild(this.playheadBadgeEl);
    playheadOverlay.appendChild(this.playheadEl);
    body.append(axisSpacer, this.axisEl, this.rowsHost, playheadOverlay);
    const slot = document.createElement("slot");
    this.container.append(header, body, slot);
    this.shadow.append(style, this.container);
    // Pointer scrubbing listeners
    this.rowsHost.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    // Observe child  mutations
    this.observer = new MutationObserver(() => this.render());
    this.addEventListener("umi-row-change", () => this.render());
  }
  private makeStepBtn(
    label: string,
    title: string,
    deltaDays: number,
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "step-btn";
    btn.textContent = label;
    btn.title = title;
    btn.addEventListener("click", () => this.shiftDays(deltaDays));
    return btn;
  }

  connectedCallback(): void {
    this.observer.observe(this, { childList: true, subtree: true });
    this.render();
    if (this._live) {
      this.start();
    }
  }

  disconnectedCallback(): void {
    this.stop();
    this.observer.disconnect();
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue) return;
    switch (name) {
      case "value":
        if (newValue) {
          const parsed = new Date(newValue);
          if (!Number.isNaN(parsed.getTime())) {
            this.baseDate = parsed;
            this.scrubbedUmi = null;
          }
        }
        break;
      case "live":
        this._live = newValue !== null && newValue !== "false";
        if (this._live) {
          this.scrubbedUmi = null;
          if (this.isConnected) this.start();
        } else {
          this.stop();
        }
        break;
      case "show-phases":
        this._showPhases = newValue !== null && newValue !== "false";
        break;
      case "dark":
        this._dark = newValue === "true" || newValue === "";
        this.container.classList.toggle("dark", this._dark);
        break;
      case "update-interval":
        if (newValue !== null) {
          const parsed = parseInt(newValue, 10);
          if (Number.isFinite(parsed) && parsed > 0) {
            this._updateInterval = parsed;
            if (this._live && this.isConnected) this.start();
          }
        }
        break;
    }
    this.render();
  }

  /**
   * Adds a location to the timeline.
   *
   * @param label Display label for the location.
   * @param latitude Latitude in decimal degrees.
   * @param longitude Longitude in decimal degrees.
   * @returns The created timeline row element.
   */
  public addLocation(
    label: string,
    latitude: number,
    longitude: number,
  ): UmiTimelineRow {
    const row = document.createElement("umi-timeline-row");
    row.setAttribute("label", label);
    const lat = clampLatitude(latitude);
    const lon = clampLongitude(longitude);
    if (lat !== null) row.setAttribute("latitude", String(lat));
    if (lon !== null) row.setAttribute("longitude", String(lon));
    this.appendChild(row);
    return row;
  }

  /**
   * Shifts the timeline by the specified number of days.
   *
   * Positive values move forward in time and negative values move backward.
   *
   * @param days Number of days to shift.
   */
  public shiftDays(days: number): void {
    const current = this.resolveTargetUmiTime().utc;
    const shifted = new Date(current.getTime() + days * 86_400_000);
    this.setBaseDate(shifted);
  }

  private setBaseDate(date: Date): void {
    this._live = false;
    this.removeAttribute("live");
    this.stop();
    this.baseDate = date;
    this.scrubbedUmi = null;
    this.render();
  }

  /**
   * Returns the timeline to live mode using the current time.
   */
  public resetToLive(): void {
    this.scrubbedUmi = null;
    this._live = true;
    this.setAttribute("live", "");
    this.start();
    this.render();
  }

  /**
   * Starts automatic updates as time advances.
   */
  public start(): void {
    this.stop();
    this.timer = window.setInterval(() => {
      if (this.scrubbedUmi === null) {
        this.render();
      }
    }, this._updateInterval);
  }

  /**
   * Stops automatic updates.
   */
  public stop(): void {
    if (this.timer !== undefined) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private getRowElements(): UmiTimelineRow[] {
    return Array.from(this.querySelectorAll("umi-timeline-row"));
  }

  private resolveTargetUmiTime(): UmiTime {
    const referenceDate =
      this._live && this.scrubbedUmi === null ? new Date() : this.baseDate;
    if (this.scrubbedUmi !== null) {
      const startOfUtcDayMs = Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth(),
        referenceDate.getUTCDate(),
      );
      const offsetMs = (this.scrubbedUmi / 360) * 86_400_000;
      return new UmiTime(new Date(startOfUtcDayMs + offsetMs));
    }
    return new UmiTime(referenceDate);
  }

  private render(): void {
    const target = this.resolveTargetUmiTime();
    const fractionalUmi =
      target.umi + (target.second + target.millisecond / 1000) / 240;

    const pct = Math.min(100, Math.max(0, (fractionalUmi / 360) * 100));
    const iso = target.utc.toISOString();

    this.headerDisplayEl.value = iso;
    this.headerUtcEl.textContent = `${iso.slice(0, 19)}Z`;

    if (document.activeElement !== this.dateInput) {
      this.dateInput.value = iso.slice(0, 10);
    }

    this.liveBtn.classList.toggle(
      "active",
      this._live && this.scrubbedUmi === null,
    );

    this.playheadEl.style.left = `${pct}%`;
    this.playheadBadgeEl.textContent = `${target.format("uuu")}ᵘ`;

    const rowElements = this.getRowElements();
    this.rowsHost.innerHTML = "";
    const snapshots: UmiTimelineRowSnapshot[] = [];

    for (const rowEl of rowElements) {
      const lat = rowEl.latitude;
      const lon = rowEl.longitude;
      const label = rowEl.label || `${lat.toFixed(1)}°, ${lon.toFixed(1)}°`;

      const locUmi = new UmiTime(
        target.utc,
        { value: lat, uncertainty: 0 },
        { value: lon, uncertainty: 0 },
      );

      const localAngle = wrap360(target.umi + lon);
      const dayPhase = Math.floor(localAngle / DAY_PHASE_WIDTH);
      const sunriseUmi = locUmi.sunrise;
      const sunsetUmi = locUmi.sunset;

      snapshots.push({
        label,
        latitude: lat,
        longitude: lon,
        dayPhase,
        sunriseUmi,
        sunsetUmi,
      });

      const rowDiv = document.createElement("div");
      rowDiv.className = "row";

      // Metadata column
      const meta = document.createElement("div");
      meta.className = "row-meta";

      const labelLine = document.createElement("div");
      labelLine.className = "row-label-line";

      const labelSpan = document.createElement("span");
      labelSpan.className = "row-label";
      labelSpan.textContent = label;

      const phaseBadge = document.createElement("span");
      phaseBadge.className = "row-phase-badge";
      phaseBadge.textContent = `\u03A6${dayPhase}`;
      labelLine.append(labelSpan, phaseBadge);

      const coordsSpan = document.createElement("span");
      coordsSpan.className = "row-coords";
      coordsSpan.textContent = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      meta.append(labelLine, coordsSpan);

      // Solar track column
      const track = document.createElement("div");
      track.className = "track";
      track.style.background = buildSolarLinearGradient(
        lat,
        lon,
        locUmi.solarDeclination,
        locUmi.equationOfTime,
      );

      if (this._showPhases) {
        this.appendAlignedPhaseGrid(track, lon);
      }

      if (sunriseUmi !== null) {
        const srMarker = document.createElement("div");
        srMarker.className = "sun-marker";
        srMarker.title = `Sunrise: ${Math.round(sunriseUmi)}ᵘ`;
        srMarker.style.left = `${wrap360(sunriseUmi) / 3.6}%`;
        track.appendChild(srMarker);
      }

      if (sunsetUmi !== null) {
        const ssMarker = document.createElement("div");
        ssMarker.className = "sun-marker";
        ssMarker.title = `Sunset: ${Math.round(sunsetUmi)}ᵘ`;
        ssMarker.style.left = `${wrap360(sunsetUmi) / 3.6}%`;
        track.appendChild(ssMarker);
      }

      rowDiv.append(meta, track);
      this.rowsHost.appendChild(rowDiv);
    }

    if (this.isDragging) {
      this.dispatchEvent(
        new CustomEvent("umi-select", {
          bubbles: true,
          detail: {
            umiTime: target,
            umi: target.umi,
            rows: snapshots,
          },
        }),
      );
    }
  }

  /**
  • Renders the 24 local Φ day-phase intervals aligned to exact longitude
  • boundaries across the 0..360 UTC track (wrapping cleanly at 0% and 100%).
  */
  private appendAlignedPhaseGrid(track: HTMLElement, lon: number): void {
    const grid = document.createElement("div");
    grid.className = "phase-grid";

    // Offset in [0, 15) where phase boundaries fall on the 0..360 UTC axis
    const firstBoundaryUmi = ((-lon % 15) + 15) % 15;
    const addCell = (startUmi: number, endUmi: number, phase: number): void => {
      const widthUmi = endUmi - startUmi;
      if (widthUmi <= 0.1) return;

      const cell = document.createElement("div");
      cell.className = "phase-cell";
      cell.style.left = `${(startUmi / 360) * 100}%`;
      cell.style.width = `${(widthUmi / 360) * 100}%`;

      // Hide label only if a wrapped sliver is too narrow to fit digits
      if (widthUmi >= 6) {
        cell.textContent = String(phase);
      }

      grid.appendChild(cell);
    };

    // Leading partial interval [0, firstBoundaryUmi)
    if (firstBoundaryUmi > 0) {
      const startPhase = Math.floor(wrap360(0 + lon) / 15);
      addCell(0, firstBoundaryUmi, startPhase);
    }

    // Full 15-umi intervals + trailing wrapped interval
    for (let startUmi = firstBoundaryUmi; startUmi < 360; startUmi += 15) {
      const endUmi = Math.min(360, startUmi + 15);
      const midUmi = (startUmi + endUmi) / 2;
      const phase = Math.floor(wrap360(midUmi + lon) / 15);

      addCell(startUmi, endUmi, phase);
    }

    track.appendChild(grid);
  }

  private onPointerDown = (e: PointerEvent): void => {
    const target = e.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const track = target.closest(".track");
    if (!track) return;

    this.isDragging = true;
    this.updateScrubFromPointer(e, track);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    const firstTrack = this.shadow.querySelector(".track");
    if (firstTrack) {
      this.updateScrubFromPointer(e, firstTrack);
    }
  };

  private onPointerUp = (): void => {
    this.isDragging = false;
  };

  private updateScrubFromPointer(e: PointerEvent, trackEl: Element): void {
    const rect = trackEl.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.min(
      1,
      Math.max(0, (e.clientX - rect.left) / rect.width),
    );
    this.scrubbedUmi = Math.round(ratio * 359);
    this.render();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-timeline": UmiTimeline;
  }
}
