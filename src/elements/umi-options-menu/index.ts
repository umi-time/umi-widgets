import { UmiOption } from "./umi-option";
import { UmiOptionsMenu } from "./umi-options-menu";

export { UmiOption };
export type { UmiOptionAttribute } from "./umi-option";

export { UmiOptionsMenu };
export type { UmiOptionsMenuAttribute } from "./umi-options-menu";

const UMI_OPTION_TAG = "umi-option";
const UMI_OPTIONS_MENU_TAG = "umi-options-menu";

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_OPTION_TAG)
) {
  customElements.define(UMI_OPTION_TAG, UmiOption);
}

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_OPTIONS_MENU_TAG)
) {
  customElements.define(
    UMI_OPTIONS_MENU_TAG,
    UmiOptionsMenu,
  );
}