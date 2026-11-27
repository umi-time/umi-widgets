// umi-world-map/index.ts

import { UmiWorldMap } from "./umi-world-map";

export { UmiWorldMap };

export * from "./world-map-projection";

export type { UmiWorldMapAttribute } from "./umi-world-map";
  
const UMI_WORLD_MAP_TAG = "umi-world-map";

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_WORLD_MAP_TAG)
) {
  customElements.define(
    UMI_WORLD_MAP_TAG,
    UmiWorldMap,
  );
}