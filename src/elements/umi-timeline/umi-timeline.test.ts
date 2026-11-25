import { afterEach, describe, expect, it } from "vitest";
import { UmiTimelineElement, UmiTimelineRowElement } from "./index";

describe("<umi-timeline>", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registers both <umi-timeline> and <umi-timeline-row>", () => {
    expect(customElements.get("umi-timeline")).toBe(UmiTimelineElement);
    expect(customElements.get("umi-timeline-row")).toBe(UmiTimelineRowElement);
  });

  it("renders stacked location rows with computed Φ day phases", () => {
    const timeline = document.createElement("umi-timeline");
    // 2026-11-01T09:34:56Z => U = 143
    timeline.setAttribute("value", "2026-11-01T09:34:56.000Z");
    timeline.setAttribute("show-phases", "");

    timeline.addLocation("Pismo Beach", 35.14, -120.64); // Φ1
    timeline.addLocation("London", 51.51, -0.13); // Φ9
    document.body.appendChild(timeline);

    const rows = timeline.shadowRoot?.querySelectorAll(".row");
    expect(rows?.length).toBe(2);

    const badges = Array.from(
      timeline.shadowRoot?.querySelectorAll(".row-phase-badge") ?? [],
    ).map((el) => el.textContent);
    expect(badges).toEqual(["\u03A61", "\u03A69"]);
  });

  it("creates a timeline element", () => {
    const timeline = document.createElement("umi-timeline");

    expect(timeline).toBeInstanceOf(UmiTimelineElement);
  });

  it("adds timeline rows", () => {
    const timeline = document.createElement("umi-timeline");
    const row = timeline.addLocation("Tokyo", 35.6764, 139.65);

    expect(row).toBeInstanceOf(UmiTimelineRowElement);
    expect(timeline.querySelectorAll("umi-timeline-row")).toHaveLength(1);
  });

  it("stores location data when adding rows", () => {
    const timeline = document.createElement("umi-timeline");

    const row = timeline.addLocation("Tokyo", 35.6764, 139.65);

    expect(row.label).toBe("Tokyo");
    expect(row.latitude).toBeCloseTo(35.6764);
    expect(row.longitude).toBeCloseTo(139.65);
  });

  it("hides phase grids when show-phases is disabled", () => {
    const timeline = document.createElement("umi-timeline");

    timeline.addLocation("London", 51.51, -0.13);
    document.body.appendChild(timeline);

    expect(timeline.shadowRoot?.querySelectorAll(".phase-grid").length).toBe(0);
  });

  it("renders phase grids when show-phases is enabled", () => {
    const timeline = document.createElement("umi-timeline");

    timeline.setAttribute("show-phases", "");
    timeline.addLocation("London", 51.51, -0.13);
    document.body.appendChild(timeline);

    expect(
      timeline.shadowRoot?.querySelectorAll(".phase-grid").length,
    ).toBeGreaterThan(0);
  });

  it("applies dark mode styling", () => {
    const timeline = document.createElement("umi-timeline");

    timeline.setAttribute("dark", "");
    document.body.appendChild(timeline);

    expect(
      timeline.shadowRoot
        ?.querySelector(".container")
        ?.classList.contains("dark"),
    ).toBe(true);
  });

  it("activates live mode from the live button", () => {
    const timeline = document.createElement("umi-timeline");

    document.body.appendChild(timeline);

    const button = timeline.shadowRoot?.querySelector(
      ".live-btn",
    ) as HTMLButtonElement;

    button.click();

    expect(timeline.live).toBe(true);
  });

  it("shiftDays leaves the timeline in non-live mode", () => {
    const timeline = document.createElement("umi-timeline");

    timeline.setAttribute("value", "2026-01-01T00:00:00.000Z");
    timeline.shiftDays(1);

    expect(timeline.live).toBe(false);
  });

  it("shows location coordinates", () => {
    const timeline = document.createElement("umi-timeline");

    timeline.addLocation("Tokyo", 35.6764, 139.65);
    document.body.appendChild(timeline);

    const coords = timeline.shadowRoot?.querySelector(".row-coords");

    expect(coords?.textContent).toContain("35.68");
    expect(coords?.textContent).toContain("139.65");
  });

  it("updates the live button appearance when live", () => {
    const timeline = document.createElement("umi-timeline");

    timeline.setAttribute("live", "");
    document.body.appendChild(timeline);

    const button = timeline.shadowRoot?.querySelector(".live-btn");

    expect(button?.classList.contains("active")).toBe(true);
  });
});
