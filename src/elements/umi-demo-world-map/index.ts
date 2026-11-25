import { UmiDemoWorldMap } from "./umi-demo-world-map";

export { UmiDemoWorldMap };

const UMI_DEMO_WORLD_MAP_TAG = "umi-demo-world-map";

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_DEMO_WORLD_MAP_TAG)
) {
  customElements.define(UMI_DEMO_WORLD_MAP_TAG, UmiDemoWorldMap);
}
