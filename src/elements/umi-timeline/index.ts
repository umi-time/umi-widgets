import { UmiTimelineElement } from "./umi-timeline";
import { UmiTimelineRowElement } from "./umi-timeline-row";

export { UmiTimelineElement, UmiTimelineRowElement };
export type {
  UmiTimelineAttribute,
  UmiTimelineRowSnapshot,
  UmiTimelineSelectDetail,
} from "./umi-timeline";
export type { UmiTimelineRowAttribute } from "./umi-timeline-row";

const UMI_TIMELINE_ROW_TAG = "umi-timeline-row";
const UMI_TIMELINE_TAG = "umi-timeline";

if (typeof window !== "undefined") {
  if (!customElements.get(UMI_TIMELINE_ROW_TAG)) {
    customElements.define(UMI_TIMELINE_ROW_TAG, UmiTimelineRowElement);
  }
  if (!customElements.get(UMI_TIMELINE_TAG)) {
    customElements.define(UMI_TIMELINE_TAG, UmiTimelineElement);
  }
}
