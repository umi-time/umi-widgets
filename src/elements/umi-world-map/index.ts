// umi-world-map/index.ts

import { UmiWorldMapElement } from "./umi-world-map";

export { UmiWorldMapElement };

export * from "./world-map-projection";
export * from "./world-map-clock";
export * from "./world-map-grid";
export * from "./world-map-terminator";

const UMI_WORLD_MAP_TAG = "umi-world-map";

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_WORLD_MAP_TAG)
) {
  customElements.define(
    UMI_WORLD_MAP_TAG,
    UmiWorldMapElement,
  );
}