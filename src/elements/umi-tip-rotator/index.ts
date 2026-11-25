import { UmiTipRotatorElement, UmiTipRotatorAttribute } from "./umi-tip-rotator";

export { UmiTipRotatorElement };
export type { UmiTipRotatorAttribute };

const UMI_TIP_ROTATOR_TAG = "umi-tip-rotator";
if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_TIP_ROTATOR_TAG)
) {
  customElements.define(
    UMI_TIP_ROTATOR_TAG,
    UmiTipRotatorElement,
  );
}