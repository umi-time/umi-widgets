# umi-widgets

Official Web Components and interactive UI widgets for **[Umi-Time](https://umitime.com)**, powered by [`umi-time`](https://npmjs.com/package/umi-time).

## Installation

### Via npm (Bundlers & Frameworks)

```bash
npm install umi-widgets
```

### Via CDN (Zero-Build HTML)

Drop a single `<script>` tag into any HTML page to register all `<umi-*>` elements automatically:

```html
<script src="https://unpkg.com/umi-widgets/dist/umi-widgets.min.js"></script>
```

## Usage

### `<umi-clock>`

An analog and digital Umi-Time dial featuring a longitude-oriented dial face, live solar elevation ring, sunrise/sunset indicators, and a 24-segment bezel.

#### In HTML (with CDN script or global registration)

```html
<umi-clock
  latitude="35.14"
  longitude="-120.64"
  size="380px"
  dark="false"
></umi-clock>
```

#### In JavaScript / TypeScript

```ts
// Import only <umi-clock> to keep bundle size small
import "umi-widgets/elements/umi-clock";

// Or import and register all widgets
// import "umi-widgets";

const clock = document.querySelector("umi-clock");
clock?.setLocation(69.65, 18.96); // Tromsø, Norway
clock?.setSize("420px");
```

#### Attributes

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `latitude` | `number` | `0` | Observer latitude in decimal degrees (`-90` to `90`). |
| `longitude` | `number` | `0` | Observer longitude in decimal degrees (`-180` to `180`). |
| `timezone` | `string` | System timezone | IANA timezone name used for the secondary civil-time readout. |
| `size` | `string` | `"900px"` | CSS width and height of the clock container (e.g., `"380px"`). |
| `dark` | `boolean` | `"false"` | Enables dark mode dial and bezel styling (`"true"` or `"false"`). |
| `update-interval` | `number` | `100` | Refresh interval configuration in milliseconds. |

#### Methods

* `setLocation(latitude: number, longitude: number): void` — Clamps coordinates to valid bounds, updates attributes, and recalculates solar geometry immediately.
* `setSize(size: string): void` — Updates the `size` attribute and recalculates the radial solar-ring mask.
* `refresh(): void` — Forces an immediate render update.
* `start(): void` / `stop(): void` — Starts or stops the `requestAnimationFrame` update loop.

## Project Structure

```text
umi-widgets/
  src/
    index.ts                ← Root entry point & full registration
    elements/
      index.ts              ← All Web Components barrel
      umi-clock/
        index.ts            ← <umi-clock> registration & exports
        umi-clock.ts        ← <umi-clock> implementation
        umi-clock.test.ts   ← Component test suite
    shared/
      colors.ts             ← Solar altitude color scales & conic-gradient builder
      coordinates.ts        ← Latitude & longitude clamping helpers
  demo/
    index.html              ← Local browser preview page
```

## Development

```bash
npm install
npm run build      # Compiles ESM, CJS, .d.ts, and minified IIFE bundles
npm test           # Runs Vitest suite in happy-dom
npm run typecheck  # Runs strict TypeScript checks
npm run lint       # Runs ESLint
```

To preview `demo/index.html` locally after building:

```bash
npx serve .
```

Then open `http://localhost:3000/demo/`.

## License

MIT License  
© 2026 Daniel Brannon and Umi-Time Contributors
