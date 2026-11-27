// index.ts
import { UmiLocation } from "./umi-location";

export { UmiLocation };
export type { UmiLocationAttribute } from "./umi-location";

const UMI_LOCATION_TAG = "umi-location"; 

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_LOCATION_TAG)
) {
  customElements.define(UMI_LOCATION_TAG, UmiLocation);
}
