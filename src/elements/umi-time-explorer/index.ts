import { UmiTimeExplorerElement } from "./umi-time-explorer";

export { UmiTimeExplorerElement };
export type { UmiTimeExplorerMode } from "./umi-time-explorer";

const UMI_TIME_EXPLORER_TAG = "umi-time-explorer";

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_TIME_EXPLORER_TAG)
) {
  customElements.define(UMI_TIME_EXPLORER_TAG, UmiTimeExplorerElement);
}
