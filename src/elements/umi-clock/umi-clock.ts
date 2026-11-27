import { UmiTime } from "umi-time";
import { buildSolarConicGradient } from "../../shared/colors";
import { clampLatitude, clampLongitude } from "../../shared/coordinates";

const SVG_NS = "http://www.w3.org/2000/svg" as const;
const UMI_SYMBOL_PATH = "M 153.7 39.4 A 76 76 0 1 1 46.3 39.4";

/**
 * Supported attributes for the <umi-clock> element.
 */
export type UmiClockAttribute =
  | "latitude"
  | "longitude"
  | "timezone"
  | "offset"
  | "size"
  | "dark";

interface SolarGeometryCache {
  gradient: string;
  sunriseDial: number | null;
  sunsetDial: number | null;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, String(value));
    }
  }
  return el;
}

/**
 * Displays a Umi-Time clock for a specific location, timezone, or offset.
 *
 * The clock can render local solar context based on latitude and longitude
 * and supports both light and dark display modes.
 */
export class UmiClock extends HTMLElement {
  static get observedAttributes(): readonly UmiClockAttribute[] {
    return ["latitude", "longitude", "timezone", "offset", "size", "dark"];
  }

  // Internal state & caches
  private _latitude = 0;
  private _longitude = 0;
  private _size = "900px";
  private _dark = false;
  private _timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  private _offset = 0;

  private readonly shadow: ShadowRoot;
  private readonly root: HTMLDivElement;
  private readonly solarRing: HTMLDivElement;
  private readonly svg: SVGSVGElement;

  private dial!: SVGGElement;
  private hands!: SVGGElement;
  private labels!: SVGGElement;
  private largeHandGroup!: SVGGElement;
  private smallHandGroup!: SVGGElement;
  private secondHandLine!: SVGLineElement;
  private digital!: SVGGElement;
  private sunIndicatorGroup!: SVGGElement;
  private bezel!: SVGGElement;
  private dialBackgroundCircle!: SVGCircleElement;
  private daySegments: SVGPathElement[] = [];

  private cachedThinTicks: SVGGElement | null = null;
  private cachedLargeTicks: SVGGElement | null = null;
  private cachedLabels: SVGGElement | null = null;

  private lastSolarMinute: number | null = null;
  private lastSolarData: SolarGeometryCache | null = null;
  private lastLatitude: number | null = null;
  private lastLongitude: number | null = null;
  private currentSegment: number | null = null;
  private timer: number | null = null;

  /** Latitude in decimal degrees used for solar calculations. */
  public get latitude(): number {
    return this._latitude;
  }

  public set latitude(value: number) {
    const latitudeValue = String(value);
    if (this.getAttribute("latitude") !== latitudeValue) {
      this.setAttribute("latitude", latitudeValue);
    }
  }

  /** Longitude in decimal degrees used for local interpretation. */
  public get longitude(): number {
    return this._longitude;
  }

  public set longitude(value: number) {
    const longitudeValue = String(value);
    if (this.getAttribute("longitude") !== longitudeValue) {
      this.setAttribute("longitude", longitudeValue);
    }
  }

  /** CSS size of the rendered clock. */
  public get size(): string {
    return this._size;
  }

  public set size(value: string) {
    if (this.getAttribute("size") !== value) {
      this.setAttribute("size", value);
    }
  }

  /** Enables the dark color scheme when true. */
  public get dark(): boolean {
    return this._dark;
  }

  public set dark(value: boolean) {
    if (this.hasAttribute("dark") !== value) {
      this.toggleAttribute("dark", value);
    }
  }

  /** IANA timezone identifier used by the clock. */
  public get timezone(): string {
    return this._timezone;
  }

  public set timezone(value: string) {
    if (this.getAttribute("timezone") !== value) {
      this.setAttribute("timezone", value);
    }
  }

  /**
   * Umi offset applied to the displayed time.
   *
   * Typically used when exploring dates and times other than the current
   * moment.
   */
  public get offset(): number {
    return this._offset;
  }

  public set offset(value: number) {
    const offsetValue = String(value);
    if (this.getAttribute("offset") !== offsetValue) {
      this.setAttribute("offset", offsetValue);
    }
  }

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "open" });

    // Root container
    this.root = document.createElement("div");
    this.root.className = "umi-clock-root";
    this.root.style.width = this._size;
    this.root.style.height = this._size;
    this.root.style.position = "relative";

    // Fixed solar ring bezel
    this.solarRing = document.createElement("div");
    this.solarRing.className = "solar-ring";
    this.solarRing.id = "solarRing";
    this.solarRing.style.position = "absolute";
    this.solarRing.style.left = "0";
    this.solarRing.style.top = "0";
    this.solarRing.style.transform = "none";
    this.solarRing.style.borderRadius = "50%";
    this.root.appendChild(this.solarRing);

    // SVG container
    this.svg = createSvgElement("svg", {
      id: "clockSvg",
      viewBox: "0 0 72 72",
      width: "100%",
      height: "100%",
    });

    this.root.appendChild(this.svg);
    this.shadow.appendChild(this.root);

    this.createSVGElements();
    this.update = this.update.bind(this);
  }

  private get outerRadius(): number {
    return 27.5;
  }

  private get dialBackground(): string {
    return this._dark ? "#080808" : "#f7f7f7";
  }

  private get foregroundColor(): string {
    return this._dark ? "#fff" : "#000";
  }

  private makeGroup(id: string): SVGGElement {
    return createSvgElement("g", { id });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  connectedCallback(): void {
    this.resizeSolarRing();
    this.start();
  }

  disconnectedCallback(): void {
    this.stop();
  }

  // ---------------------------------------------------------------------------
  // Attribute changes
  // ---------------------------------------------------------------------------
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue) return;

    switch (name as UmiClockAttribute) {
      case "latitude":
        if (newValue !== null) this.setClampedLatitude(parseFloat(newValue));
        break;
      case "longitude":
        if (newValue !== null) this.setClampedLongitude(parseFloat(newValue));
        break;
      case "timezone":
        this._timezone =
          newValue || Intl.DateTimeFormat().resolvedOptions().timeZone;
        break;
      case "offset": {
        const parsed = parseFloat(newValue ?? "");
        this._offset = Number.isFinite(parsed) ? parsed : 0;
        this.lastSolarMinute = null;
        break;
      }
      case "size":
        this._size = newValue || "900px";
        this.root.style.width = this._size;
        this.root.style.height = this._size;
        this.resizeSolarRing();
        break;
      case "dark":
        this._dark = newValue === "true" || newValue === "";
        this.updateDarkMode();
        break;
    }

    this.update();
  }

  private resizeSolarRing(): void {
    this.solarRing.style.width = this._size;
    this.solarRing.style.height = this._size;

    const sizeValue = parseFloat(this._size);
    if (!Number.isFinite(sizeValue)) return;

    const minRadius = (sizeValue / 2) * (this.outerRadius / 36);
    const maxRadius = (sizeValue / 2) * (30 / 36);

    const maskValue = `radial-gradient(circle, transparent 0, transparent ${minRadius}px, black ${minRadius}px, black ${maxRadius}px, transparent ${maxRadius}px, transparent 100%)`;
    this.solarRing.style.mask = maskValue;
    this.solarRing.style.webkitMask = maskValue;
  }

  /**
   * Updates the clock's geographic location.
   *
   * @param lat Latitude in decimal degrees.
   * @param lon Longitude in decimal degrees.
   */
  public setLocation(lat: number, lon: number): void {
    this.setClampedLatitude(lat);
    this.setClampedLongitude(lon);
    this.setAttribute("latitude", String(this._latitude));
    this.setAttribute("longitude", String(this._longitude));
    this.lastSolarMinute = null;
    this.update();
  }

  /**
   * Updates the rendered size of the clock.
   *
   * @param size CSS size value such as "400px" or "50vh".
   */
  public setSize(size: string): void {
    this._size = size;
    this.setAttribute("size", size);
  }

  private setClampedLatitude(lat: number): void {
    const clamped = clampLatitude(lat);
    if (clamped === null) return;
    this._latitude = clamped;
    this.lastSolarMinute = null;
  }

  private setClampedLongitude(lon: number): void {
    const clamped = clampLongitude(lon);
    if (clamped === null) return;
    this._longitude = clamped;
    this.lastSolarMinute = null;
  }

  // ---------------------------------------------------------------------------
  // Update loop control
  // ---------------------------------------------------------------------------

  /**
   * Starts live clock updates.
   */
  public start(): void {
    this.stop();
    const tick = (): void => {
      this.update();
      this.timer = requestAnimationFrame(tick);
    };
    this.timer = requestAnimationFrame(tick);
  }

  /**
   * Stops live clock updates.
   */
  public stop(): void {
    if (this.timer !== null) {
      cancelAnimationFrame(this.timer);
      this.timer = null;
    }
  }

  // ---------------------------------------------------------------------------
  // SVG Elements
  // ---------------------------------------------------------------------------
  private createSVGElements(): void {
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    this.svg.appendChild(this.createSVGStyles());
    this.svg.appendChild(this.createSVGDefs());
    this.svg.appendChild(this.createDial());
    this.svg.appendChild(this.createDigitalDisplay());
    this.svg.appendChild(this.createHands());
    this.svg.appendChild(this.createSunIndicatorGroup());
    this.svg.appendChild(this.createBezel());
  }

  private createSVGStyles(): SVGStyleElement {
    const style = createSvgElement("style");
    style.textContent = `
      .outer-background-shading { fill: #808080; opacity: 0.24; stroke: none; }
      .inner-background-shading { fill: #808080; opacity: 0.62; stroke: none; }
      .bezel-day-segment { fill: transparent; transition: fill 250ms ease, opacity 250ms ease; }
      .bezel-day-segment.active { fill: rgba(0, 255, 0, 0.6); stroke: rgba(255, 255, 255, 0.25); stroke-width: 0.15; }
      .compass-ring { fill: none; stroke: #444444; stroke-width: 0.4; }
      .cardinal-point { fill: #888888; stroke: #444444; stroke-width: 0.2; }
      .ordinal-point { fill: #666666; stroke: #444444; stroke-width: 0.2; }
      .tick-line { stroke: #555555; stroke-width: 0.3; stroke-linecap: round; }
      #bezelGroup.dark-mode .tick-line { stroke: #bbbbbb; }
      #dial, #hands { transition: transform 1.5s ease-in-out; }
    `;
    return style;
  }

  private createSVGDefs(): SVGDefsElement {
    const defs = createSvgElement("defs");

    defs.appendChild(this.createDialMask());
    defs.appendChild(this.createDialDropShadow());
    defs.appendChild(this.createHandDropShadow());
    defs.appendChild(this.createBevelLeftGradient());
    defs.appendChild(this.createBevelRightGradient());
    defs.appendChild(this.createCardinalPoint());
    defs.appendChild(this.createOrdinalPoint());
    defs.appendChild(this.createHandMask());

    return defs;
  }

  private createDialMask(): SVGMaskElement {
    const mask = createSvgElement("mask", { id: "solarBezelMask" });

    mask.appendChild(
      createSvgElement("rect", {
        x: 0,
        y: 0,
        width: 72,
        height: 72,
        fill: "black",
      }),
    );

    mask.appendChild(
      createSvgElement("circle", {
        cx: 36,
        cy: 36,
        r: 26,
        fill: "white",
      }),
    );
    mask.appendChild(
      createSvgElement("circle", {
        cx: 36,
        cy: 36,
        r: 30,
        fill: "white",
      }),
    );
    return mask;
  }

  private createDialDropShadow(): SVGFilterElement {
    const filter = createSvgElement("filter", { id: "dropShadow" });
    filter.appendChild(
      createSvgElement("feDropShadow", {
        dx: 0,
        dy: 0,
        stdDeviation: 2,
        "flood-color": "#000",
        "flood-opacity": 0.35,
      }),
    );
    return filter;
  }

  private createHandDropShadow(): SVGFilterElement {
    const filter = createSvgElement("filter", {
      id: "hand-shadow",
      x: "-30%",
      y: "-30%",
      width: "160%",
      height: "160%",
    });
    filter.appendChild(
      createSvgElement("feDropShadow", {
        dx: 0,
        dy: 0,
        stdDeviation: 0.4,
        "flood-color": "#000000",
        "flood-opacity": 0.4,
      }),
    );
    return filter;
  }

  private createBevelLeftGradient(): SVGLinearGradientElement {
    const grad = createSvgElement("linearGradient", {
      id: "bevel-left",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
    });
    grad.appendChild(
      createSvgElement("stop", { offset: "0%", "stop-color": "#4a4a4a" }),
    );
    grad.appendChild(
      createSvgElement("stop", { offset: "60%", "stop-color": "#656565" }),
    );
    grad.appendChild(
      createSvgElement("stop", { offset: "100%", "stop-color": "#808080" }),
    );
    return grad;
  }

  private createBevelRightGradient(): SVGLinearGradientElement {
    const grad = createSvgElement("linearGradient", {
      id: "bevel-right",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
    });
    grad.appendChild(
      createSvgElement("stop", { offset: "0%", "stop-color": "#202020" }),
    );
    grad.appendChild(
      createSvgElement("stop", { offset: "40%", "stop-color": "#303030" }),
    );
    grad.appendChild(
      createSvgElement("stop", { offset: "100%", "stop-color": "#454545" }),
    );
    return grad;
  }

  private createCardinalPoint(): SVGGElement {
    const g = this.makeGroup("cardinal-3d");
    g.appendChild(
      createSvgElement("polygon", {
        points: "0,-30 -2,-30 0,-35",
        fill: "url(#bevel-left)",
      }),
    );
    g.appendChild(
      createSvgElement("polygon", {
        points: "0,-30 2,-30 0,-35",
        fill: "url(#bevel-right)",
      }),
    );
    g.appendChild(
      createSvgElement("polygon", {
        points: "0,-30 -2,-30 0,-35 2,-30",
        fill: "none",
        stroke: "#333333",
        "stroke-width": 0.2,
      }),
    );
    return g;
  }

  private createOrdinalPoint(): SVGGElement {
    const g = this.makeGroup("ordinal-3d");
    g.appendChild(
      createSvgElement("polygon", {
        points: "0,-30 -1.2,-30 0,-34",
        fill: "url(#bevel-left)",
      }),
    );
    g.appendChild(
      createSvgElement("polygon", {
        points: "0,-30 1.2,-30 0,-34",
        fill: "url(#bevel-right)",
      }),
    );
    g.appendChild(
      createSvgElement("polygon", {
        points: "0,-30 -1.2,-30 0,-34 1.2,-30",
        fill: "none",
        stroke: "#333333",
        "stroke-width": 0.2,
      }),
    );
    return g;
  }

  private createHandMask(): SVGMaskElement {
    const mask = createSvgElement("mask", { id: "hand-mask" });
    mask.appendChild(
      createSvgElement("rect", {
        x: -36,
        y: -36,
        width: 72,
        height: 72,
        fill: "#ffffff",
      }),
    );
    mask.appendChild(
      createSvgElement("path", {
        d: "M -0.85,-0.85 A 1.2 1.2 0 1 0 0.85,-0.85 L 1.56,-1.56 A 2.2 2.2 0 1 1 -1.56,-1.56 Z",
        fill: "#000000",
      }),
    );
    return mask;
  }

  private createDial(): SVGGElement {
    this.dial = this.makeGroup("dial");
    this.dialBackgroundCircle = createSvgElement("circle", {
      cx: 0,
      cy: 0,
      r: this.outerRadius,
      fill: this.dialBackground,
    });
    this.dial.appendChild(this.dialBackgroundCircle);
    this.dial.appendChild(this.createThinTicks());
    this.dial.appendChild(this.createLargeTicks());
    this.dial.appendChild(this.createLabels());
    return this.dial;
  }

  private createThinTicks(): SVGGElement {
    if (this.cachedThinTicks) return this.cachedThinTicks;
    const group = this.makeGroup("thinTicks");
    for (let deg = 0; deg < 360; deg += 3) {
      const g = createSvgElement("g", { transform: `rotate(${deg})` });
      g.appendChild(
        createSvgElement("rect", {
          x: -0.15,
          y: -this.outerRadius,
          width: 0.25,
          height: 2,
          fill: "#777",
        }),
      );
      group.appendChild(g);
    }
    this.cachedThinTicks = group;
    return group;
  }

  private createLargeTicks(): SVGGElement {
    if (this.cachedLargeTicks) return this.cachedLargeTicks;
    const group = this.makeGroup("largeTicks");
    for (let deg = 0; deg < 360; deg += 15) {
      const g = createSvgElement("g", { transform: `rotate(${deg})` });
      g.appendChild(
        createSvgElement("rect", {
          x: -0.375,
          y: -this.outerRadius,
          width: deg % 30 === 0 ? 0.75 : 0.5,
          height: deg % 30 === 0 ? 3.5 : 3,
          fill: "#777",
        }),
      );
      group.appendChild(g);
    }
    this.cachedLargeTicks = group;
    return group;
  }

  private createLabels(): SVGGElement {
    if (this.cachedLabels) return this.cachedLabels;
    const labels = this.makeGroup("labels");
    [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].forEach((umi) => {
      const radius = this.outerRadius - 5.75;
      const rad = ((umi - 90) * Math.PI) / 180;
      const x = radius * Math.cos(rad);
      const y = radius * Math.sin(rad);
      // Measure width when attached to DOM; fall back to character estimate when off-DOM
      let numberWidth = String(umi).length * 1.65;
      if (this.isConnected) {
        const temp = createSvgElement("text", {
          x: 0,
          y: 0,
          "font-size": "3",
        });
        temp.textContent = String(umi);
        this.svg.appendChild(temp);
        const measured = temp.getBBox().width;
        if (measured > 0) {
          numberWidth = measured;
        }
        temp.remove();
      }
      const g = createSvgElement("g", {
        transform: `rotate(${umi} ${x} ${y})`,
      });
      labels.appendChild(g);
      const t = createSvgElement("text", {
        x,
        y,
        "font-size": "3",
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        fill: this.foregroundColor,
      });
      t.textContent = String(umi);
      g.appendChild(t);
      const symbol = createSvgElement("svg", {
        x: x + numberWidth / 2 + 0.25,
        y: y - 1.5,
        width: "1.2",
        height: "1.2",
        viewBox: "0 0 200 200",
      });
      symbol.appendChild(
        createSvgElement("path", {
          d: UMI_SYMBOL_PATH,
          fill: "none",
          stroke: this.foregroundColor,
          "stroke-width": "45.6",
          "stroke-linecap": "butt",
        }),
      );
      g.appendChild(symbol);
    });
    this.cachedLabels = labels;
    this.labels = labels;
    return labels;
  }

  private createHands(): SVGGElement {
    this.hands = this.makeGroup("hands");

    this.hands.appendChild(this.createLargeHand());
    this.hands.appendChild(this.createSmallHand());

    return this.hands;
  }

  private createLargeHand(): SVGGElement {
    this.largeHandGroup = this.makeGroup("largeHandGroup");
    this.largeHandGroup.setAttribute("filter", "url(#hand-shadow)");
    this.largeHandGroup.setAttribute("mask", "url(#hand-mask)");
    this.largeHandGroup.appendChild(
      createSvgElement("path", {
        d: "M -3,0 A 3 3 0 0 0 0,3 L 0,-20 Z",
        fill: "url(#bevel-left)",
      }),
    );
    this.largeHandGroup.appendChild(
      createSvgElement("path", {
        d: "M 3,0 A 3 3 0 0 1 0,3 L 0,-20 Z",
        fill: "url(#bevel-right)",
      }),
    );
    this.largeHandGroup.appendChild(
      createSvgElement("path", {
        d: "M -3,0 A 3 3 0 1 0 3,0 L 0,-20 Z",
        fill: "none",
        stroke: "#808080",
        "stroke-width": 0.25,
      }),
    );
    return this.largeHandGroup;
  }

  private createSmallHand(): SVGGElement {
    this.smallHandGroup = this.makeGroup("smallHandGroup");
    this.smallHandGroup.appendChild(
      createSvgElement("circle", {
        cx: 0,
        cy: 0,
        r: 1,
        fill: "#aaa",
        stroke: "#999",
        "stroke-width": 0.25,
      }),
    );
    this.secondHandLine = createSvgElement("line", {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: -24,
      stroke: "#aaa",
      "stroke-width": 0.6,
      "stroke-linecap": "round",
    });
    this.smallHandGroup.appendChild(this.secondHandLine);
    return this.smallHandGroup;
  }

  private createDigitalDisplay(): SVGGElement {
    this.digital = this.makeGroup("digitalTime");
    this.digital.setAttribute("transform", "translate(36, 36) rotate(0.1)");
    return this.digital;
  }
  private createSunIndicatorGroup(): SVGGElement {
    this.sunIndicatorGroup = this.makeGroup("sunIndicatorGroup");
    this.sunIndicatorGroup.setAttribute("transform", "translate(36, 36)");
    return this.sunIndicatorGroup;
  }
  private createRingSegment(
    startDeg: number,
    endDeg: number,
    innerR: number,
    outerR: number,
  ): string {
    const startRad = ((startDeg + 90) * Math.PI) / 180;
    const endRad = ((endDeg + 90) * Math.PI) / 180;
    const x1o = outerR * Math.cos(startRad);
    const y1o = outerR * Math.sin(startRad);
    const x2o = outerR * Math.cos(endRad);
    const y2o = outerR * Math.sin(endRad);
    const x1i = innerR * Math.cos(endRad);
    const y1i = innerR * Math.sin(endRad);
    const x2i = innerR * Math.cos(startRad);
    const y2i = innerR * Math.sin(startRad);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
      "Z",
    ].join(" ");
  }

  private createBezel(): SVGGElement {
    this.bezel = this.makeGroup("bezelGroup");
    this.bezel.setAttribute("transform", "translate(36,36)");
    this.daySegments = [];
    for (let i = 0; i < 24; i++) {
      const segment = createSvgElement("path", {
        d: this.createRingSegment(i * 15, (i + 1) * 15, 30, 32.4),
        class: "bezel-day-segment",
      });
      this.daySegments.push(segment);
      this.bezel.appendChild(segment);
    }
    this.bezel.appendChild(
      createSvgElement("path", {
        class: "inner-background-shading",
        "fill-rule": "evenodd",
        d: "M 0,-32.4 A 32.4,32.4 0 1,1 -0.01,-32.4 Z M 0,-30 A 30,30 0 1,0 0.01,-30 Z",
      }),
    );
    this.bezel.appendChild(
      createSvgElement("path", {
        class: "outer-background-shading",
        "fill-rule": "evenodd",
        d: "M 0,-35 A 35,35 0 1,1 -0.01,-35 Z M 0,-32.4 A 32.4,32.4 0 1,0 0.01,-32.4 Z",
      }),
    );
    this.bezel.appendChild(
      createSvgElement("circle", {
        class: "compass-ring",
        r: 30,
        cx: 0,
        cy: 0,
      }),
    );
    const cardinalAngles = [0, 90, 180, 270];
    for (const angle of cardinalAngles) {
      const attrs: Record<string, string> = { href: "#cardinal-3d" };
      if (angle !== 0) attrs.transform = `rotate(${angle})`;
      this.bezel.appendChild(createSvgElement("use", attrs));
    }
    const ordinalAngles = [45, 135, 225, 315];
    for (const angle of ordinalAngles) {
      this.bezel.appendChild(
        createSvgElement("use", {
          href: "#ordinal-3d",
          transform: `rotate(${angle})`,
        }),
      );
    }
    const intermediateTicks = [
      15, 30, 60, 75, 105, 120, 150, 165, 195, 210, 240, 255, 285, 300, 330,
      345,
    ];
    for (const angle of intermediateTicks) {
      this.bezel.appendChild(
        createSvgElement("line", {
          x1: 0,
          y1: -30,
          x2: 0,
          y2: -32.4,
          class: "tick-line",
          transform: `rotate(${angle})`,
        }),
      );
    }
    return this.bezel;
  }

  private updateDarkMode(): void {
    this.dialBackgroundCircle.setAttribute("fill", this.dialBackground);
    this.labels.querySelectorAll("text").forEach((text) => {
      text.setAttribute("fill", this.foregroundColor);
    });
    this.labels.querySelectorAll("path").forEach((umiSymbol) => {
      umiSymbol.setAttribute("stroke", this.foregroundColor);
    });
    this.secondHandLine.setAttribute(
      "stroke",
      this._dark ? "#cccccc" : "#666666",
    );
    if (this._dark) {
      this.bezel.classList.add("dark-mode");
    } else {
      this.bezel.classList.remove("dark-mode");
    }
  }

  // ---------------------------------------------------------------------------
  // Main update loop
  // ---------------------------------------------------------------------------
  private update(): void {
    const currentTime = new Date();

    if (this._offset != 0) {
      currentTime.setUTCMinutes(currentTime.getUTCMinutes() + this._offset * 4);
    }

    const umiObj = new UmiTime(
      currentTime,
      { value: this._latitude, uncertainty: 0 },
      { value: this._longitude, uncertainty: 0 },
    );
    const umi = umiObj.umi;
    const umiSec = umiObj.second + umiObj.millisecond / 1000;
    const dialRotation = 180 + this._longitude;

    if (this.lastLongitude !== this._longitude) {
      const transform = `translate(36,36) rotate(${dialRotation})`;

      this.dial.setAttribute("transform", transform);
      this.hands.setAttribute("transform", transform);
    }

    // Hand rotations
    this.largeHandGroup.setAttribute("transform", `rotate(${umi})`);
    this.smallHandGroup.setAttribute("transform", `rotate(${umiSec * 1.5})`);

    // Day segments
    const bezelAngle = (((umi + this._longitude) % 360) + 360) % 360;
    const activeSegment = Math.floor(bezelAngle / 15);
    if (activeSegment !== this.currentSegment) {
      if (this.currentSegment !== null) {
        this.daySegments[this.currentSegment]?.classList.remove("active");
      }
      this.daySegments[activeSegment]?.classList.add("active");
      this.currentSegment = activeSegment;
    }

    // Solar geometry (cached per minute)
    const { gradient, sunriseDial, sunsetDial } = this.computeSunAngles(
      this._latitude,
      this._longitude,
      currentTime,
    );

    this.solarRing.style.background = gradient;
    this.drawSunIndicators(sunriseDial, sunsetDial);
    this.updateDigitalDisplay(dialRotation, umi, umiSec, currentTime);

    this.lastLatitude = this._latitude;
    this.lastLongitude = this._longitude;
  }

  // ---------------------------------------------------------------------------
  // Sunrise/sunset indicators
  // ---------------------------------------------------------------------------
  private drawSunIndicators(
    sunriseDial: number | null,
    sunsetDial: number | null,
  ): void {
    const group = this.sunIndicatorGroup;
    while (group.firstChild) {
      group.removeChild(group.firstChild);
    }
    if (sunriseDial !== null) {
      group.appendChild(this.makeIndicator(sunriseDial));
    }
    if (sunsetDial !== null) {
      group.appendChild(this.makeIndicator(sunsetDial));
    }
  }
  private makeIndicator(angle: number): SVGGElement {
    const g = createSvgElement("g", { transform: `rotate(${angle})` });
    g.appendChild(
      createSvgElement("line", {
        x1: 0,
        y1: -(this.outerRadius + 2),
        x2: 0,
        y2: -(this.outerRadius - 2),
        stroke: this.foregroundColor,
        "stroke-width": 0.8,
      }),
    );
    return g;
  }

  // ---------------------------------------------------------------------------
  // Solar gradient + sunrise/sunset angles
  // ---------------------------------------------------------------------------
  private computeSunAngles(
    lat: number,
    lon: number,
    date: Date,
  ): SolarGeometryCache {
    const minute = date.getUTCMinutes();
    if (
      minute === this.lastSolarMinute &&
      lat === this.lastLatitude &&
      lon === this.lastLongitude &&
      this.lastSolarData !== null
    ) {
      return this.lastSolarData;
    }
    this.lastSolarMinute = minute;

    const umi = new UmiTime(
      date,
      { value: lat, uncertainty: 0 },
      { value: lon, uncertainty: 0 },
    );
    const sunriseDial = umi.sunrise !== null ? umi.sunrise + lon + 180 : null;
    const sunsetDial = umi.sunset !== null ? umi.sunset + lon + 180 : null;
    const gradient = buildSolarConicGradient(
      lat,
      umi.solarDeclination,
      umi.equationOfTime,
    );
    const result: SolarGeometryCache = {
      gradient,
      sunriseDial,
      sunsetDial,
    };
    this.lastSolarData = result;
    return result;
  }

  // ---------------------------------------------------------------------------
  // Digital display
  // ---------------------------------------------------------------------------
  private updateDigitalDisplay(
    dialRotation: number,
    umi: number,
    umiSec: number,
    now: Date,
  ): void {
    const digital = this.digital;
    digital.innerHTML = "";
    const radius = (this.outerRadius - 6) / 2;
    const handAngle = (((dialRotation + umi) % 360) + 360) % 360;
    const pointingUp = handAngle < 90 || handAngle > 270;
    const pos = pointingUp ? { x: 0, y: radius } : { x: 0, y: -radius };
    // Umi number + symbol group
    const t1a = createSvgElement("g", {
      transform: `translate(${pos.x}, ${pos.y - 1})`,
    });
    digital.appendChild(t1a);
    const degText = createSvgElement("text", {
      x: 0,
      y: 0,
      "font-size": "4.5",
      "text-anchor": "end",
      fill: this.foregroundColor,
    });
    degText.textContent = String(umi);
    t1a.appendChild(degText);
    const umiSymbol = createSvgElement("svg", {
      x: 0,
      y: -3.5,
      width: "1.5",
      height: "1.5",
      viewBox: "0 0 200 200",
    });
    umiSymbol.appendChild(
      createSvgElement("path", {
        d: UMI_SYMBOL_PATH,
        fill: "none",
        stroke: this.foregroundColor,
        "stroke-width": "45.6",
        "stroke-linecap": "butt",
      }),
    );
    t1a.appendChild(umiSymbol);
    // Umi seconds
    const t1b = createSvgElement("text", {
      x: pos.x + 1.5,
      y: pos.y - 1,
      "font-size": "3",
      "text-anchor": "start",
      fill: this.foregroundColor,
    });
    t1b.textContent = `${Math.floor(umiSec)}s`;
    digital.appendChild(t1b);
    // Civil time
    const t2 = createSvgElement("text", {
      x: pos.x,
      y: pos.y + 3,
      "font-size": "3.25",
      "text-anchor": "middle",
      fill: "gray",
    });
    t2.textContent = this.formatCivilTime(now);
    digital.appendChild(t2);
  }

  private formatCivilTime(date: Date): string {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: this._timezone,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return formatter.format(date);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-clock": UmiClock;
  }
}
