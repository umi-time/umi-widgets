import { UmiReadout } from "./umi-readout";

export { UmiReadout };
export type { UmiReadoutAttribute } from "./umi-readout";

const UMI_READOUT_TAG = "umi-readout";
if (typeof window !== "undefined" && !customElements.get(UMI_READOUT_TAG)) {
  customElements.define(UMI_READOUT_TAG, UmiReadout);
}
