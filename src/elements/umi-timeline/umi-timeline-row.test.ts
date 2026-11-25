import { describe, expect, it } from "vitest";

import "./index";

describe("umi-timeline-row", () => {
  it("registers as a custom element", () => {
    expect(customElements.get("umi-timeline-row")).toBeDefined();
  });

  it("reads label from attribute", () => {
    const row = document.createElement("umi-timeline-row");

    row.setAttribute("label", "Tokyo");

    expect(row.label).toBe("Tokyo");
  });

  it("reads latitude from attribute", () => {
    const row = document.createElement("umi-timeline-row");

    row.setAttribute("latitude", "35.6764");

    expect(row.latitude).toBeCloseTo(35.6764);
  });

  it("reads longitude from attribute", () => {
    const row = document.createElement("umi-timeline-row");

    row.setAttribute("longitude", "139.65");

    expect(row.longitude).toBeCloseTo(139.65);
  });

  it("emits umi-row-change", () => {
    const row = document.createElement("umi-timeline-row");

    let fired = false;

    row.addEventListener("umi-row-change", () => {
      fired = true;
    });

    row.setAttribute("label", "Tokyo");

    expect(fired).toBe(true);
  });

  it("emits bubbling events", () => {
    const row = document.createElement("umi-timeline-row");

    let received: Event | undefined;

    row.addEventListener("umi-row-change", (event) => {
      received = event;
    });

    row.setAttribute("label", "Tokyo");

    expect(received).toBeDefined();
    expect(received!.bubbles).toBe(true);
  });
});
