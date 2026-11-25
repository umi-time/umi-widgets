// src/elements/umi-time-explorer/umi-time-explorer.ts

import "../umi-display";

export type UmiTimeExplorerAttribute = "mode";

export type UmiTimeExplorerMode = "datetime" | "day" | "time";

const DATE_FORMATTER =
  new Intl.DateTimeFormat(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    },
  );

export class UmiTimeExplorerElement extends HTMLElement {
  static get observedAttributes(): readonly UmiTimeExplorerAttribute[] {
    return ["mode"];
  }

  private shadowRootRef: ShadowRoot;

  private modeValue: UmiTimeExplorerMode = "datetime";

  private selectedDayOffset = 0;
  private selectedUmiOffset = 0;

  private umiDateElement!: HTMLDivElement;
  private umiDisplayElement!: HTMLElement;

  private dayContainerElement!: HTMLDivElement;
  private daySliderElement!: HTMLInputElement;
  private dayValueElement!: HTMLSpanElement;

  private timeContainerElement!: HTMLDivElement;
  private timeSliderElement!: HTMLInputElement;
  private timeValueElement!: HTMLSpanElement;

  private displayTimer: number | undefined;

  constructor() {
    super();

    this.shadowRootRef = this.attachShadow({
      mode: "open",
    });
  }

  get mode(): UmiTimeExplorerMode {
    return this.modeValue;
  }

  set mode(value: UmiTimeExplorerMode) {
    const normalized = this.normalizeMode(value);

    this.modeValue = normalized;

    if (this.getAttribute("mode") !== normalized) {
      this.setAttribute("mode", normalized);
    }

    if (this.isConnected) {
      this.updateMode();
      this.updateDisplay();
    }
  }

  connectedCallback(): void {
    this.render();
    this.updateMode();
    this.updateDisplay();
  }

  disconnectedCallback(): void {
    if (this.displayTimer) {
      clearInterval(this.displayTimer);

      this.displayTimer = undefined;
    }
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    value: string | null,
  ): void {
    if (name !== "mode") {
      return;
    }

    this.modeValue = this.normalizeMode(value);

    if (!this.isConnected) {
      return;
    }

    this.updateMode();
    this.updateDisplay();
  }

  private normalizeMode(value: string | null): UmiTimeExplorerMode {
    return value === "day" || value === "time" || value === "datetime"
      ? value
      : "datetime";
  }

  private render(): void {
    this.shadowRootRef.innerHTML = `
      <style>
        :host {
          display: flex;
          font-family: system-ui, sans-serif;
          flex: 1 1 auto;
        }

        .explorer {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0.5rem;
          padding: 1rem;
          flex: 1 1 auto;
        }

        .selection {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
        }

        .selection-date {
          font-weight: 600;
        }

        .selection-time {
          font-size: 1rem;
        }

        .control {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: -1.65rem;
        }

        input[type="range"] {
          width: 100%;
        }

        .datetime-control {
          display: flex;
          flex-direction: row;
          gap: 1rem;
        }

        .datetime-slider-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
        }

        .slider-container {
          padding: 0 3.5rem;
        }

        /* Modern Blue Button styling */
        .btn-modern {
          /* Layout & Sizing */
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 6px 12px;
          min-height: 36px;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        
          /* Typography */
          font-size: 0.95rem;
          font-weight: 600;
          color: #ffffff;
          text-decoration: none;
          letter-spacing: -0.01em;

          /* Shaping & Borders */
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;

          /* Shadows & Effects */
          box-shadow:
            0 1px 2px 0 rgba(0, 0, 0, 0.05),
            0 4px 12px 0 rgba(37, 99, 235, 0.2);

          /* Animation Timing */
          transition:
            background 0.2s ease,
            transform 0.1s ease,
            box-shadow 0.2s ease;
        }

        /* Hover State: Subtle color shift and lifting shadow effect */
        .btn-modern:hover {
          box-shadow:
            0 1px 2px 0 rgba(0, 0, 0, 0.05),
            0 8px 20px 0 rgba(37, 99, 235, 0.35);
        }

        /* Active State: Tactile press-down effect */
        .btn-modern:active {
          transform: scale(0.98);
          box-shadow:
            0 1px 2px 0 rgba(0, 0, 0, 0.05),
            0 2px 6px 0 rgba(37, 99, 235, 0.2);
        }

        /* Focus State: Accessible ring highlight for keyboard navigation */
        .btn-modern:focus-visible {
          outline-offset: 2px;
        }

        .btn-modern.blue {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }
        .btn-modern.blue:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }
        .btn-modern.blue:focus-visible {
          outline: 2px solid #60a5fa;
        }

        .btn-modern.gray {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        }
        .btn-modern.gray:hover {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
        }
        .btn-modern.gray:focus-visible {
          outline: 2px solid #60a5fa;
        }
      </style>

      <div class="explorer">
        <div class="datetime-control">
          <div class="datetime-slider-container">
            <div class="control day-control">
              <div class="header">
                <span>Day</span>
                <span class="day-value"></span>
              </div>

              <div class="slider-container">
                <input
                  class="day-slider"
                  type="range"
                  min="-182"
                  max="183"
                  value="0"
                />
              </div>
            </div>

            <div class="control time-control">
              <div class="header">
                <span>Time</span>
                <span class="time-value"></span>
              </div>

              <div class="slider-container">
                <input
                  class="time-slider"
                  type="range"
                  min="-179"
                  max="180"
                  value="0"
                />
              </div>
            </div>
          </div>

          <button type="button" class="live-button btn-modern blue">
            Live
          </button>
        </div>

        <div class="selection">
          <div class="selection-date"></div>
          <umi-display class="selection-time"></umi-display>
        </div>

      </div>
    `;

    this.umiDateElement = this.shadowRootRef.querySelector(
      ".selection-date",
    ) as HTMLDivElement;

    this.umiDisplayElement = this.shadowRootRef.querySelector(
      ".selection-time",
    ) as HTMLElement;

    this.dayContainerElement = this.shadowRootRef.querySelector(
      ".day-control",
    ) as HTMLDivElement;

    this.daySliderElement = this.shadowRootRef.querySelector(
      ".day-slider",
    ) as HTMLInputElement;

    this.dayValueElement = this.shadowRootRef.querySelector(
      ".day-value",
    ) as HTMLSpanElement;

    this.timeContainerElement = this.shadowRootRef.querySelector(
      ".time-control",
    ) as HTMLDivElement;

    this.timeSliderElement = this.shadowRootRef.querySelector(
      ".time-slider",
    ) as HTMLInputElement;

    this.timeValueElement = this.shadowRootRef.querySelector(
      ".time-value",
    ) as HTMLSpanElement;

    const liveButton = this.shadowRootRef.querySelector(
      ".live-button",
    ) as HTMLButtonElement;

    this.daySliderElement.addEventListener("input", () => {
      this.selectedDayOffset = Number(this.daySliderElement.value);

      this.updateDisplay();
      this.emitTimeChange();
    });

    this.timeSliderElement.addEventListener("input", () => {
      this.selectedUmiOffset = Number(this.timeSliderElement.value);

      this.updateDisplay();
      this.emitTimeChange();
    });

    liveButton.addEventListener("click", () => {
      this.selectedDayOffset = 0;
      this.selectedUmiOffset = 0;

      this.daySliderElement.value = "0";
      this.timeSliderElement.value = "0";

      this.updateDisplay();
      this.emitTimeChange();
    });

    this.displayTimer = window.setInterval(() => this.updateDisplay(), 1000);
  }

  private updateMode(): void {
    if (!this.dayContainerElement) {
      return;
    }

    this.dayContainerElement.hidden = this.modeValue === "time";

    this.timeContainerElement.hidden = this.modeValue === "day";
  }

  private updateDisplay(): void {
    const selectedDate = this.getSelectedDate();

    this.umiDateElement.textContent = DATE_FORMATTER.format(selectedDate);

    this.umiDisplayElement.setAttribute("value", selectedDate.toISOString());

    this.dayValueElement.textContent =
      this.selectedDayOffset === 0
        ? "Today"
        : `${this.selectedDayOffset > 0 ? "+" : ""}${this.selectedDayOffset}d`;

    this.timeValueElement.textContent =
      this.selectedUmiOffset === 0
        ? "Now"
        : `${this.selectedUmiOffset > 0 ? "+" : ""}${this.selectedUmiOffset}u`;
  }

  private getSelectedDate(): Date {
    const selected = new Date(Date.now());

    selected.setUTCDate(selected.getUTCDate() + this.selectedDayOffset);

    selected.setUTCMinutes(selected.getUTCMinutes() + this.selectedUmiOffset * 4);
    return selected;
  }

  private emitTimeChange(): void {
    this.dispatchEvent(
      new CustomEvent("umi-time-change", {
        detail: this.selectedDayOffset * 360 + this.selectedUmiOffset,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-time-explorer": UmiTimeExplorerElement;
  }
}
