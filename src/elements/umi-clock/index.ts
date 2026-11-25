// src/elements/umi-clock/index.ts
import { UmiClock } from "./umi-clock";

export { UmiClock };
export type { UmiClockAttribute } from "./umi-clock";

const UMI_CLOCK_TAG = "umi-clock";
if (typeof window !== "undefined" && !customElements.get(UMI_CLOCK_TAG)) {
  customElements.define(UMI_CLOCK_TAG, UmiClock);
}