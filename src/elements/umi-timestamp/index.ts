import { UmiTimestamp } from "./umi-timestamp";

export { UmiTimestamp };
export type { UmiTimestampAttribute } from "./umi-timestamp";

const ELEMENT_NAME = "umi-timestamp";

if (
  typeof window !== "undefined" &&
  !customElements.get(ELEMENT_NAME)
) {
  customElements.define(ELEMENT_NAME, UmiTimestamp);
}
