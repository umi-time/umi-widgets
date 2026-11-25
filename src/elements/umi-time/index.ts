import { UmiTimeElement } from "./umi-time";

export { UmiTimeElement };
export type { UmiTimeAttribute } from "./umi-time";

const ELEMENT_NAME = "umi-time";

if (
  typeof window !== "undefined" &&
  !customElements.get(ELEMENT_NAME)
) {
  customElements.define(ELEMENT_NAME, UmiTimeElement);
}
