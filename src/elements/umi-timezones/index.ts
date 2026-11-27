import { UmiTimezones } from "./umi-timezones";

export { UmiTimezones };
export type { UmiTimezonesAttribute } from "./umi-timezones";

const UMI_TIMEZONES_TAG = "umi-timezones";

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_TIMEZONES_TAG)
) {
  customElements.define(
    UMI_TIMEZONES_TAG,
    UmiTimezones,
  );
}