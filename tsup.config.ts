import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      "elements/index": "src/elements/index.ts",
      "elements/umi-clock/index": "src/elements/umi-clock/index.ts",
      "elements/umi-demo-bouncing-clock/index": "src/elements/umi-demo-bouncing-clock/index.ts",
      "elements/umi-demo-world-map/index": "src/elements/umi-demo-world-map/index.ts",
      "elements/umi-location/index": "src/elements/umi-location/index.ts",
      "elements/umi-options-menu/index": "src/elements/umi-options-menu/index.ts",
      "elements/umi-readout/index": "src/elements/umi-readout/index.ts",
      "elements/umi-time-explorer/index": "src/elements/umi-time-explorer/index.ts",
      "elements/umi-timeline/index": "src/elements/umi-timeline/index.ts",
      "elements/umi-timestamp/index": "src/elements/umi-timestamp/index.ts",
      "elements/umi-timezones/index": "src/elements/umi-timezones/index.ts",
      "elements/umi-tip/index": "src/elements/umi-tip/index.ts",
      "elements/umi-tip-rotator/index": "src/elements/umi-tip-rotator/index.ts",
      "elements/umi-world-map/index": "src/elements/umi-world-map/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: ["umi-time"],
    loader: {
      ".svg": "text",
    },
  },
  {
    entry: {
      "umi-widgets.min": "src/index.ts",
    },
    format: ["iife"],
    globalName: "UmiWidgets",
    minify: true,
    sourcemap: true,
    noExternal: ["umi-time"],
    outExtension() {
      return { js: ".js" };
    },
    loader: {
      ".svg": "text",
    },
  },
]);
