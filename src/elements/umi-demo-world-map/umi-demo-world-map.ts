const MAP_LAYER_LATITUDE = "latitude";
const MAP_LAYER_LONGITUDE = "longitude";
const MAP_LAYER_TERMINATOR = "terminator";
const MAP_LAYER_TIMEZONES = "timezones";
const MAP_LAYER_PINNED_CLOCKS = "pinned-clocks";
const MAP_LAYER_CURSOR_CLOCK = "cursor-clock";
const MAP_LAYER_TIPS = "tips";

/**
 * Demonstrates the interactive Umi-Time world map, including pinned
 * locations, timezone boundaries, day/night visualization, map layers,
 * and guided explanatory tips.
 */
export class UmiDemoWorldMap extends HTMLElement {
  private readonly shadow: ShadowRoot;
  private initialized = false;

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "open" });

    this.shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          overflow: hidden;
          background: #e9ecef;
          font-family: system-ui, sans-serif;
        }

        .control-panel {
          flex: 0 0 auto;
          z-index: 10;
        }

        .map-viewport {
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
        }

        .map-container {
          position: relative;
          flex: 1 1 auto;
          overflow: auto;
          min-height: 0;
        }

        .map-content {
          display: flex;
          align-items: center;
          width: 100%;
          height: 100%;
        }

        @media (max-aspect-ratio: 1652/1220) {
          umi-world-map {
            height: 100%;
            width: auto;
          }
        }

        @media (min-aspect-ratio: 1652/1220) {
          umi-world-map {
            width: 100%;
            height: auto;
          }
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

        umi-options-menu {
          position: fixed;
          top: 12px;
          left: 12px;
        }
      </style>

      <section class="control-panel">
        <umi-time-explorer id="time-explorer"></umi-time-explorer>
      </section>

      <section class="map-viewport">
        <div class="map-container">
          <div class="map-content">
            <umi-world-map
              id="world-map"
              live
              show-latitude-grid
              show-longitude-grid
              show-terminator
              show-pinned-clocks
              show-cursor-clock
              show-grid-overlay
            >
              <umi-timezones id="timezones"</umi-timezones>

              <umi-location label="Pismo Beach" latitude="35.14" longitude="-120.64"></umi-location>
              <umi-location label="Honolulu" latitude="21.31" longitude="-157.86"></umi-location>
              <umi-location label="New York" latitude="40.71" longitude="-74.01"></umi-location>
              <umi-location label="Bogotá" latitude="4.71" longitude="-74.07"></umi-location>
              <umi-location label="Buenos Aires" latitude="-34.61" longitude="-58.38"></umi-location>
              <umi-location label="London" latitude="51.5072" longitude="-0.1276"></umi-location>
              <umi-location label="Johannesburg" latitude="-26.20" longitude="28.04"></umi-location>
              <umi-location label="Cairo" latitude="30.04" longitude="31.24"></umi-location>
              <umi-location label="Moscow" latitude="55.75" longitude="37.62"></umi-location>
              <umi-location label="Mumbai" latitude="19.08" longitude="72.88"></umi-location>
              <umi-location label="Singapore" latitude="1.35" longitude="103.82"></umi-location>
              <umi-location label="Chongqing" latitude="29.56" longitude="106.55"></umi-location>
              <umi-location label="Tokyo" latitude="35.6764" longitude="139.65"></umi-location>
              <umi-location label="Sydney" latitude="-33.87" longitude="151.21"></umi-location>
              <umi-location label="Fairbanks" latitude="64.84" longitude="-147.72"></umi-location>
            </umi-world-map>
          </div>
        </div>

        <umi-tip-rotator id="tips" storage-key="umi-time-map-tips">
            <umi-tip
            focus-on="Umi‑Time Map"
            explanation="It shows a single global moment unfolding across the Earth."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the bright and dark regions."
            explanation="They show where it is currently day and where it is night."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the curved boundary."
            explanation="This line tracks where sunrise and sunset are happening right now."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the seasonal tilt."
            explanation="Daylight reaches farther toward one pole depending on the season."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the day and time sliders."
            explanation="Move them to see how daylight changes throughout the year and day."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the grid lines."
            explanation="They show the standard latitude and longitude lines of the globe."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the red boundaries."
            explanation="They mark the world's current legal time zones."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the floating clock."
            explanation="Move your pointer or tap the map to explore Umi‑Time from different locations."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the pinned clocks."
            explanation="They show how the same Umi-Time is represented world-wide."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the units around the dial."
            explanation="The circle is divided into 360 umi instead of 12 or 24 hours."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the Map Layers menu."
            explanation="Turn different layers on and off to explore the map."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the size of an umi."
            explanation="Each umi lasts exactly four UTC minutes or 240 UTC seconds."
            ></umi-tip>

            <umi-tip
            focus-on="Move the clock east or west."
            explanation="The clock dial rotates to match the selected longitude."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the top of the dial."
            explanation="The clock dial rotates to keep noon at the top."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the bottom of the dial."
            explanation="The clock dial rotates to keep midnight at the bottom."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the colored solar ring."
            explanation="It shows daylight, twilight, and night, plus sunrise and sunset markers."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the clock hand."
            explanation="It points to the current umi."
            ></umi-tip>

            <umi-tip
            focus-on="Move the clock north and south across the equator."
            explanation="The solar ring adapts to the changing daylight periods."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the connection between umi and longitude."
            explanation="A day has 360 umi, just as the Earth has 360 degrees of longitude."
            ></umi-tip>

            <umi-tip
            focus-on="Notice what always stays the same."
            explanation="Every location on Earth shares the exact same umi timestamp."
            ></umi-tip>

            <umi-tip
            focus-on="Notice what Umi‑Time removes."
            explanation="It eliminates political offsets, arithmetic, and daylight saving shifts."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the universal simplicity."
            explanation="Umi‑Time shares the exact same physical seconds as UTC."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the perspective shift."
            explanation="The focus moves from local clocks to a shared global moment."
            ></umi-tip>

            <umi-tip
            focus-on="Notice the clock as a whole."
            explanation="One Earth. One synchronized moment. Countless local perspectives."
            ></umi-tip>
        </umi-tip-rotator>

        <umi-options-menu
          id="map-layers"
          label="Map Layers"
          storage-key="map-layers">
          <umi-option value="latitude" checked>Latitude Lines</umi-option>
          <umi-option value="longitude" checked>Longitude Lines</umi-option>
          <umi-option value="timezones" checked>Time Zones</umi-option>
          <umi-option value="terminator" checked>Nighttime Shadow</umi-option>
          <umi-option value="pinned-clocks" checked>Pinned Clocks</umi-option>
          <umi-option value="cursor-clock" checked>Cursor Clock</umi-option>
          <umi-option value="tips" checked>Tips</umi-option>
        </umi-options-menu>
      </section>
    `;
  }

  connectedCallback(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    const explorer = this.shadow.getElementById("time-explorer");
    const worldMap = this.shadow.getElementById("world-map");
    const mapLayers = this.shadow.getElementById("map-layers");
    const tips = this.shadow.getElementById("tips");

    explorer?.addEventListener("umi-time-change", ((event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      worldMap?.setAttribute("offset", String(event.detail));
    }) as EventListener);

    mapLayers?.addEventListener("umi-option-change", ((event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const { value, checked } = event.detail;

      switch (value) {
        case MAP_LAYER_LATITUDE:
          this.toggleAttributeOnTarget(worldMap, "show-latitude-grid", checked);
          break;

        case MAP_LAYER_LONGITUDE:
          this.toggleAttributeOnTarget(
            worldMap,
            "show-longitude-grid",
            checked,
          );
          break;

        case MAP_LAYER_TERMINATOR:
          this.toggleAttributeOnTarget(worldMap, "show-terminator", checked);
          break;

        case MAP_LAYER_TIMEZONES:
          this.toggleAttributeOnTarget(worldMap, "show-grid-overlay", checked);
          break;

        case MAP_LAYER_PINNED_CLOCKS:
          this.toggleAttributeOnTarget(worldMap, "show-pinned-clocks", checked);
          break;

        case MAP_LAYER_CURSOR_CLOCK:
          this.toggleAttributeOnTarget(worldMap, "show-cursor-clock", checked);
          break;

        case MAP_LAYER_TIPS:
          if (tips instanceof HTMLElement) {
            tips.hidden = !checked;
          }
          break;
      }
    }) as EventListener);

    queueMicrotask(() => {
      const container = this.shadow.querySelector(".map-container");

      if (!(container instanceof HTMLElement)) {
        return;
      }

      container.scrollLeft =
        (container.scrollWidth - container.clientWidth) / 2;

      container.scrollTop =
        (container.scrollHeight - container.clientHeight) / 2;
    });
  }

  private toggleAttributeOnTarget(
    target: Element | null,
    attribute: string,
    enabled: boolean,
  ): void {
    if (!target) {
      return;
    }

    if (enabled) {
      target.setAttribute(attribute, "");
    } else {
      target.removeAttribute(attribute);
    }
  }
}
