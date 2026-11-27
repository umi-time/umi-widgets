/**
 * Supported attributes for the <umi-demo-bouncing-clock> element.
 */
export type UmiDemoBouncingClockAttribute = "dark";

interface DemoLocation {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

const BASE_VELOCITY = 0.2;
const MAX_VELOCITY_ADJUSTMENT_SIZE = 0.5;
const MIN_CLOCK_SIZE = 180;
const MAX_CLOCK_SIZE = 600;
const INTRINSIC_CLOCK_SIZE = 900;

/**
 * Demonstrates an animated Umi-Time clock that moves around the viewport,
 * showcasing the clock component and its responsive behavior.
 */
export class UmiDemoBouncingClock extends HTMLElement {
  static get observedAttributes(): readonly UmiDemoBouncingClockAttribute[] {
    return ["dark"];
  }

  private _dark = false;
  private animationFrame = 0;
  private x = 100;
  private y = 100;
  private vx = 0.9 * BASE_VELOCITY;
  private vy = 0.7 * BASE_VELOCITY;
  private clockSize = MAX_CLOCK_SIZE;

  private fullscreenListener?: () => void;
  private initialized = false;
  private animating = false;

  private resizeObserver?: ResizeObserver;
  private locations: DemoLocation[] = [];
  private readonly shadow: ShadowRoot;

  /** Enables the dark color scheme when true. */
  public get dark(): boolean {
    return this._dark;
  }

  public set dark(value: boolean) {
    if (this.hasAttribute("dark") !== value) {
      this.toggleAttribute("dark", value);
    }
  }

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "open" });

    this.shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }

        /* ---------------------------------------------------------
          Control panel and tips panel
        --------------------------------------------------------- */

        .section-header {
          position: relative;
          background: rgba(0,0,0,0.2);
          display: flex;
          flex-direction: row;
        }
        .section-header.hidden {
          display: none;
        }

        .control-panel {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem 1rem;
        }

        .control-panel.open {
          display: flex;
        }

        .control-panel label {
          color: black;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;
        }

        .control-panel select {
          width: 100%;
          padding: 0.6rem;
          background: #111;
          color: white;
        }

        @media (max-width: 600px) {
          .section-header {
            flex-direction: column;
          }

          .control-panel {
            flex-direction: row;
          }
        }

        .tips-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
        }

        .clock-viewport {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          min-height: 0;

          /*
           * Creates a containing block for position:fixed descendants.
           * This allows the tip rotator to remain fixed within the
           * component viewport rather than the browser viewport.
          */
          transform: translate(0);

          background-image: var(--clock-background-image);
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
        }

        .clock-container {
          position: relative;
          flex: 1 1 auto;
          overflow: auto;
          min-height: 0;
        }

        #clockWrapper {
          position: relative;
          display: flex;
          flex: 1 1 auto;
          min-height: 0;
          overflow: hidden;
          align-items: center;
          width: 100%;
          height: 100%;
        }

        #umi-clock {
          position: absolute;
          left: 0;
          top: 0;
        }

        /* ---------------------------------------------------------
        Fullscreen toggle button
        --------------------------------------------------------- */

        .fullscreen-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          z-index: 2000;

          background: rgba(0,0,0,0.55);
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;

          font-size: 18px;
          cursor: pointer;
        }

        .fullscreen-btn:hover {
          background: rgba(0,0,0,0.75);
        }

        umi-tip-rotator:not([hidden]) {
          display: flex;
        }

        umi-tip-rotator {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: none;
          align-items: center;
          justify-content: center;
          min-height: 4rem;
          padding: 0.5rem 1rem;
          text-align: center;
          background: rgba(255,255,255,.2);
          pointer-events: none;
        }
      </style>

      <section class="section-header">
        <div class="control-panel">
          <label class="tips-toggle">
            <input id="showTips" type="checkbox" checked />
            <span>Show Tips</span>
          </label>

          <label>
            <span title="Location">📍</span>
            <select id="locationSelect">
              <umi-location label="Pismo Beach" latitude="35.14" longitude="-120.64" timezone="America/Los_Angeles"></umi-location>
              <umi-location label="Honolulu" latitude="21.31" longitude="-157.86" timezone="Pacific/Honolulu"></umi-location>
              <umi-location label="New York" latitude="40.71" longitude="-74.01" timezone="America/New_York"></umi-location>
              <umi-location label="Bogotá" latitude="4.71" longitude="-74.07" timezone="America/Bogota"></umi-location>
              <umi-location label="Buenos Aires" latitude="-34.61" longitude="-58.38" timezone="America/Argentina/Buenos_Aires"></umi-location>
              <umi-location label="London" latitude="51.5072" longitude="-0.1276" timezone="Europe/London"></umi-location>
              <umi-location label="Johannesburg" latitude="-26.20" longitude="28.04" timezone="Africa/Johannesburg"></umi-location>
              <umi-location label="Cairo" latitude="30.04" longitude="31.24" timezone="Africa/Cairo"></umi-location>
              <umi-location label="Moscow" latitude="55.75" longitude="37.62" timezone="Europe/Moscow"></umi-location>
              <umi-location label="Mumbai" latitude="19.08" longitude="72.88" timezone="Asia/Kolkata"></umi-location>
              <umi-location label="Singapore" latitude="1.35" longitude="103.82" timezone="Asia/Singapore"></umi-location>
              <umi-location label="Chongqing" latitude="29.56" longitude="106.55" timezone="Asia/Shanghai"></umi-location>
              <umi-location label="Tokyo" latitude="35.6764" longitude="139.65" timezone="Asia/Tokyo"></umi-location>
              <umi-location label="Sydney" latitude="-33.87" longitude="151.21" timezone="Australia/Sydney"></umi-location>
              <umi-location label="Fairbanks" latitude="64.84" longitude="-147.72" timezone="America/Anchorage"></umi-location>
            </select>
          </label>
        </div>

        <umi-time-explorer id="time-explorer"></umi-time-explorer>
      </section>

      <section class="clock-viewport">
        <div class="clock-container">
          <div id="clockWrapper">
            <umi-clock
              id="umi-clock"
              live>
            </umi-clock>
          </div>
        </div>

        <umi-tip-rotator
          id="tips"
          storage-key="umi-time-clock-tips">

          <umi-tip
            focus-on="Umi‑Time"
            explanation="It shows UTC in a locally meaningful way."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the larger number."
            explanation="It is the current Umi‑Time."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the smaller number."
            explanation="It shows the current umi-second."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the values around the dial."
            explanation="They are umi values."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the large hand."
            explanation="It points to the current umi."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the thin hand."
            explanation="It shows the seconds within the current umi."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the dial."
            explanation="It rotates with longitude."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the top of the dial."
            explanation="It always represents local solar noon."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the bottom of the dial."
            explanation="It always represents local solar midnight."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the colored ring."
            explanation="It shows daylight, twilight, and night."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the lit bezel segment."
            explanation="It shows the current local hour."
          ></umi-tip>

          <umi-tip
            focus-on="Notice that the bezel is fixed."
            explanation="It provides a reference for your local solar day."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the city selector."
            explanation="Try viewing the clock from another location."
          ></umi-tip>

          <umi-tip
            focus-on="Try another city."
            explanation="The Umi‑Time stays the same everywhere on Earth."
          ></umi-tip>

          <umi-tip
            focus-on="Notice what changed."
            explanation="The dial rotates, but the Umi‑Time does not change."
          ></umi-tip>

          <umi-tip
            focus-on="Notice what stayed the same."
            explanation="Everyone on Earth shares the same Umi‑Time."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the day and time sliders."
            explanation="Change the date and time to see how the clock responds."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the green lit segment in the outer bezel."
            explanation="It highlights the current phase of your local day."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the clock as a whole."
            explanation="It shows universal time personalized for your location."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the relationship to UTC."
            explanation="0<sup>u</sup> occurs at UTC midnight"
          ></umi-tip>

          <umi-tip
            focus-on="Notice the size of a day."
            explanation="A day contains 360 umi."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the size of an umi."
            explanation="Each umi contains exactly 240 seconds."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the simplicity."
            explanation="Umi‑Time uses the same seconds as UTC."
          ></umi-tip>

          <umi-tip
            focus-on="Notice the advantage."
            explanation="One global time. Many local experiences."
          ></umi-tip>

        </umi-tip-rotator>

        <button
          id="fullscreenToggle"
          class="fullscreen-btn"
          aria-label="Toggle fullscreen"
          type="button">
          ⛶
        </button>
      </section>

    `;
  }

  connectedCallback(): void {
    if (!this.initialized) {
      this.initializeControls();
      this.populateLocations();
      this.detectLocation();

      const wrapper = this.shadow.getElementById("clockWrapper");

      if (wrapper instanceof HTMLElement) {
        this.resizeObserver = new ResizeObserver(() => {
          this.updateClockSize();
        });

        this.resizeObserver.observe(wrapper);
      }

      this.initialized = true;
    }

    this.updateTheme();
    this.updateClockSize();
    this.startAnimation();
  }

  disconnectedCallback(): void {
    cancelAnimationFrame(this.animationFrame);

    if (this.fullscreenListener) {
      document.removeEventListener("fullscreenchange", this.fullscreenListener);
    }

    this.resizeObserver?.disconnect();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue) {
      return;
    }

    if (name === "dark") {
      this._dark = newValue !== null;
      this.updateTheme();
    }
  }

  private detectLocation(): void {
    const geolocation = navigator.geolocation;

    if (!geolocation) {
      return;
    }

    geolocation.getCurrentPosition(
      (position) => {
        this.addMyLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        //
        // Permission denied
        // or unavailable.
        //
        // Remain on
        // default Pismo Beach.
        //
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000,
      },
    );
  }

  private updateTheme(): void {
    const dark = this._dark;
    const themedElements = this.shadow.querySelectorAll(
      "umi-clock, umi-time-explorer, umi-tip-rotator",
    );

    themedElements.forEach((element) => {
      if (dark) {
        element.setAttribute("dark", "");
      } else {
        element.removeAttribute("dark");
      }
    });

    this.shadow.host.classList.toggle("dark", dark);
  }

  private initializeControls(): void {
    const fullscreenButton = this.shadow.getElementById(
      "fullscreenToggle",
    ) as HTMLButtonElement;

    const tips = this.shadow.getElementById("tips") as HTMLElement;
    const showTips = this.shadow.getElementById("showTips") as HTMLInputElement;

    fullscreenButton.addEventListener("click", async () => {
      if (!document.fullscreenElement) {
        await this.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    });

    showTips.addEventListener("change", () => {
      const fullscreen = document.fullscreenElement === this;
      tips.hidden = fullscreen || !showTips.checked;
    });

    const sectionHeader = this.shadow.querySelector(
      ".section-header",
    ) as HTMLElement;

    const updateFullscreenState = () => {
      const fullscreen = document.fullscreenElement === this;

      // Set the visibility of the section header and tips based on fullscreen state.
      // For section header, add a class of hidden. For tips, set the hidden property.
      if (fullscreen) {
        sectionHeader.classList.add("hidden");
      } else {
        sectionHeader.classList.remove("hidden");
      }

      tips.hidden = fullscreen || !showTips.checked;
    };

    this.fullscreenListener = updateFullscreenState;
    document.addEventListener("fullscreenchange", this.fullscreenListener);

    updateFullscreenState();

    const explorer = this.shadow.getElementById("time-explorer");
    const umiClock = this.shadow.getElementById("umi-clock");

    explorer?.addEventListener("umi-time-change", ((event: Event) => {
      const custom = event as CustomEvent<number>;

      umiClock?.setAttribute("offset", String(custom.detail));
    }) as EventListener);
  }

  private populateLocations(): void {
    const select = this.shadow.getElementById(
      "locationSelect",
    ) as HTMLSelectElement;

    const locationElements = Array.from(
      select.querySelectorAll("umi-location"),
    ) as HTMLElement[];

    this.locations = locationElements.map((element) => ({
      label: element.getAttribute("label") ?? "",
      latitude: Number(element.getAttribute("latitude")),
      longitude: Number(element.getAttribute("longitude")),
      timezone: element.getAttribute("timezone") ?? "",
    }));

    select.replaceChildren();

    for (const location of this.locations) {
      const option = document.createElement("option");
      option.textContent = location.label;
      option.value = location.label;
      select.appendChild(option);
    }

    select.addEventListener("change", () => {
      const location = this.locations.find(
        (item) => item.label === select.value,
      );

      if (!location) {
        return;
      }

      const clock = this.shadow.getElementById("umi-clock") as HTMLElement;

      clock.setAttribute("latitude", String(location.latitude));
      clock.setAttribute("longitude", String(location.longitude));
      clock.setAttribute("timezone", String(location.timezone));
    });

    select.dispatchEvent(new Event("change"));
  }

  private addMyLocation(latitude: number, longitude: number): void {
    const select = this.shadow.getElementById(
      "locationSelect",
    ) as HTMLSelectElement;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const location: DemoLocation = {
      label: "My Location",
      latitude,
      longitude,
      timezone,
    };

    this.locations.unshift(location);

    const option = document.createElement("option");

    option.textContent = "My Location";
    option.value = "My Location";
    select.insertBefore(option, select.firstChild);
    select.value = "My Location";
    select.dispatchEvent(new Event("change"));
  }

  private randomVelocityAdjustment(value: number): number {
    // Adjust the velocity up or down by a factor keeping the result with 0.5 to 2.0 of the base velocity
    const adjustmentSize = MAX_VELOCITY_ADJUSTMENT_SIZE; // Maximum adjustment size
    const adjustmentFactor =
      1 - adjustmentSize + 2 * adjustmentSize * Math.random(); // Random factor
    const adjustedValue = value * adjustmentFactor;
    const sign = Math.sign(value);
    return (
      sign *
      Math.max(
        0.5 * BASE_VELOCITY,
        Math.min(2 * BASE_VELOCITY, Math.abs(adjustedValue)),
      )
    );
  }

  private bounce(cw: HTMLElement, cc: HTMLElement): void {
    const edgeOffset = -10 * (this.clockSize / INTRINSIC_CLOCK_SIZE);
    let changed = false;

    if (this.x < edgeOffset) {
      this.vx = Math.abs(this.vx);
      changed = true;
    } else if (this.x + cc.offsetWidth > cw.clientWidth - edgeOffset) {
      this.vx = -Math.abs(this.vx);
      changed = true;
    }

    if (this.y < edgeOffset) {
      this.vy = Math.abs(this.vy);
      changed = true;
    } else if (this.y + cc.offsetHeight > cw.clientHeight - edgeOffset) {
      this.vy = -Math.abs(this.vy);
      changed = true;
    }

    if (changed) {
      this.vx = this.randomVelocityAdjustment(this.vx);
      this.vy = this.randomVelocityAdjustment(this.vy);

      console.log(`vx=${this.vx}, vy=${this.vy}`);
    }
  }

  private updateClockSize(): void {
    const wrapper = this.shadow.getElementById("clockWrapper");
    const clock = this.shadow.getElementById("umi-clock");

    if (!(wrapper instanceof HTMLElement) || !(clock instanceof HTMLElement)) {
      return;
    }

    const available = Math.min(wrapper.clientWidth, wrapper.clientHeight);
    this.clockSize = Math.min(
      MAX_CLOCK_SIZE,
      Math.max(MIN_CLOCK_SIZE, Math.floor(available * 0.6)),
    );

    clock.setAttribute("size", `${this.clockSize}px`);
  }

  private startAnimation(): void {
    if (this.animating) {
      return;
    }

    this.animating = true;
    const wrapper = this.shadow.getElementById("clockWrapper") as HTMLElement;
    const clock = this.shadow.getElementById("umi-clock") as HTMLElement;

    const animate = () => {
      this.x += this.vx;
      this.y += this.vy;

      this.bounce(wrapper, clock);

      clock.style.transform = `translate(${this.x}px, ${this.y}px)`;

      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }
}
