import { UmiTimezonesElement } from "./umi-timezones";

export { UmiTimezonesElement };
export type { UmiTimezonesAttribute } from "./umi-timezones";

export * from "./world-map-timezones";

const UMI_TIMEZONES_TAG = "umi-timezones";

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_TIMEZONES_TAG)
) {
  customElements.define(
    UMI_TIMEZONES_TAG,
    UmiTimezonesElement,
  );
}