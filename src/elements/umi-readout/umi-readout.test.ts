import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UmiReadout } from "./index";

describe("<umi-readout>", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("registers the custom element safely", () => {
    expect(customElements.get("umi-readout")).toBe(UmiReadout);
  });

  it("renders umi degrees and symbol by default", () => {
    const el = document.createElement("umi-readout");
    // 2026-11-01T09:34:56.000Z => 143:176
    el.setAttribute("value", "2026-11-01T09:34:56.000Z");
    document.body.appendChild(el);

    const timeEl = el.shadowRoot?.querySelector("time");
    expect(timeEl?.textContent).toBe("143");
    expect(el.shadowRoot?.querySelector("svg")).not.toBeNull();
    expect(
      el.shadowRoot?.querySelector(".seconds")?.hasAttribute("hidden"),
    ).toBe(true);
    expect(
      el.shadowRoot?.querySelector(".day-phase")?.hasAttribute("hidden"),
    ).toBe(true);
  });

  it("includes seconds when the seconds attribute is present", () => {
    const el = document.createElement("umi-readout");
    el.setAttribute("value", "2026-11-01T09:34:56.000Z");
    el.setAttribute("seconds", "");
    document.body.appendChild(el);

    const secondsEl = el.shadowRoot?.querySelector(".seconds");
    expect(secondsEl?.hasAttribute("hidden")).toBe(false);
    expect(secondsEl?.textContent).toBe("176s");
  });

  it("includes the Φ day-phase suffix when longitude is provided", () => {
    const el = document.createElement("umi-readout");
    // U = 143, lon = -120.64 => (((143 - 120.64) % 360) + 360) % 360 = 22.36 => floor(22.36 / 15) = 1
    el.setAttribute("value", "2026-11-01T09:34:56.000Z");
    el.setAttribute("seconds", "");
    el.setAttribute("longitude", "-120.64");
    document.body.appendChild(el);

    const phaseEl = el.shadowRoot?.querySelector(".day-phase");
    expect(phaseEl?.hasAttribute("hidden")).toBe(false);
    expect(phaseEl?.textContent).toBe("\u03A61");
    expect(el.shadowRoot?.querySelector("time")?.textContent).toBe(
      "143176s\u03A61",
    );
  });

  it("ticks live and stops interval on disconnect", () => {
    vi.setSystemTime(new Date("2026-11-01T00:00:00.000Z"));

    const el = document.createElement("umi-readout");
    el.setAttribute("live", "");
    el.setAttribute("seconds", "");
    document.body.appendChild(el);

    expect(el.shadowRoot?.querySelector("time")?.textContent).toBe("000000s");

    vi.advanceTimersByTime(6 * 60 * 60 * 1000); // +90 umi
    expect(el.shadowRoot?.querySelector("time")?.textContent).toBe("090000s");

    const clearSpy = vi.spyOn(window, "clearInterval");
    el.remove();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("renders invalid time for invalid input", () => {
    const el = document.createElement("umi-readout");

    el.setAttribute("value", "not-a-time");
    document.body.appendChild(el);

    expect(el.shadowRoot?.querySelector("time")?.textContent).toBe(
      "Invalid time",
    );
  });

  it("updates the datetime attribute", () => {
    const el = document.createElement("umi-readout");

    el.setAttribute("value", "2026-11-01T09:34:56.000Z");
    document.body.appendChild(el);

    expect(el.shadowRoot?.querySelector("time")?.getAttribute("datetime")).toBe(
      "2026-11-01T09:34:56.000Z",
    );
  });

  it("removes longitude display when longitude is cleared", () => {
    const el = document.createElement("umi-readout") as UmiReadout;

    el.setAttribute("value", "2026-11-01T09:34:56.000Z");
    document.body.appendChild(el);

    el.setLongitude(-120.64);

    expect(
      el.shadowRoot?.querySelector(".day-phase")?.hasAttribute("hidden"),
    ).toBe(false);

    el.setLongitude(null);

    expect(
      el.shadowRoot?.querySelector(".day-phase")?.hasAttribute("hidden"),
    ).toBe(true);
  });

  it("updates the interval from the update-interval attribute", () => {
    const el = document.createElement("umi-readout") as UmiReadout;

    el.setAttribute("update-interval", "1000");

    expect(el.updateInterval).toBe(1000);
  });
});
