import { defineConfig } from "tsup";

export default defineConfig([
  // 1. Library ESM + CJS + TypeScript declarations
  {
    entry: {
      index: "src/index.ts",
      "elements/index": "src/elements/index.ts",
      "elements/umi-clock/index": "src/elements/umi-clock/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ["umi-time"],
  },
  // 2. Self-contained CDN bundle for direct <script> usage
  {
    entry: {
      "umi-widgets.min": "src/index.ts",
    },
    format: ["iife"],
    globalName: "UmiWidgets",
    minify: true,
    sourcemap: true,
    noExternal: ["umi-time"],
    outExtension: () => ({ js: ".js" }),
  },
]);
