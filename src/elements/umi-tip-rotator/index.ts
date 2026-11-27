import { UmiTipRotator } from "./umi-tip-rotator";

export { UmiTipRotator };
export type { UmiTipRotatorAttribute } from "./umi-tip-rotator";

const UMI_TIP_ROTATOR_TAG = "umi-tip-rotator";
if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_TIP_ROTATOR_TAG)
) {
  customElements.define(
    UMI_TIP_ROTATOR_TAG,
    UmiTipRotator,
  );
}