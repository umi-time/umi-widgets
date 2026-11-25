import { UmiDisplayElement } from "./umi-display";

export { UmiDisplayElement };
export type { UmiDisplayAttribute } from "./umi-display";

const UMI_DISPLAY_TAG = "umi-display";
if (typeof window !== "undefined" && !customElements.get(UMI_DISPLAY_TAG)) {
  customElements.define(UMI_DISPLAY_TAG, UmiDisplayElement);
}
