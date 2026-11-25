import { UmiOptionElement, UmiOptionAttribute } from "./umi-option";
import { UmiOptionsMenuElement, UmiOptionsMenuAttribute } from "./umi-options-menu";

export { UmiOptionElement };
export type { UmiOptionAttribute };

export { UmiOptionsMenuElement };
export type { UmiOptionsMenuAttribute };

const UMI_OPTION_TAG = "umi-option";
const UMI_OPTIONS_MENU_TAG = "umi-options-menu";

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_OPTION_TAG)
) {
  customElements.define(UMI_OPTION_TAG, UmiOptionElement);
}

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_OPTIONS_MENU_TAG)
) {
  customElements.define(
    UMI_OPTIONS_MENU_TAG,
    UmiOptionsMenuElement,
  );
}