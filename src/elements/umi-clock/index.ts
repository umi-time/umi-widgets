// src/elements/umi-clock/index.ts
import { UmiClock } from "./umi-clock";

export { UmiClock };
export type { UmiClockAttribute } from "./umi-clock";

if (typeof window !== "undefined" && !customElements.get("umi-clock")) {
  customElements.define("umi-clock", UmiClock);
}