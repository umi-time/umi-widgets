// index.ts
import { UmiLocationElement } from "./umi-location";

export { UmiLocationElement } from "./umi-location";

const UMI_LOCATION_TAG = "umi-location"; 

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_LOCATION_TAG)
) {
  customElements.define(UMI_LOCATION_TAG, UmiLocationElement);
}
