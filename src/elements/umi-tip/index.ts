import { UmiTipElement } from "./umi-tip";

export { UmiTipElement };
export type { UmiTipAttribute } from "./umi-tip";

const UMI_TIP_TAG = "umi-tip"; 
if (typeof window !== "undefined" && !customElements.get(UMI_TIP_TAG)) {
  customElements.define(UMI_TIP_TAG, UmiTipElement);
}