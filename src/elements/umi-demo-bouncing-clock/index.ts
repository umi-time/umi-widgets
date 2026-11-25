import { UmiDemoBouncingClock } from "./umi-demo-bouncing-clock";

export { UmiDemoBouncingClock };

const UMI_DEMO_BOUNCING_CLOCK_TAG = "umi-demo-bouncing-clock";

if (
  typeof window !== "undefined" &&
  !customElements.get(UMI_DEMO_BOUNCING_CLOCK_TAG)
) {
  customElements.define(UMI_DEMO_BOUNCING_CLOCK_TAG, UmiDemoBouncingClock);
}
