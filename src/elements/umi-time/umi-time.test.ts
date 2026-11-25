import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UmiTimeElement } from "./index";

describe("<umi-time>", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("registers the custom element safely", () => {
    expect(customElements.get("umi-time")).toBe(UmiTimeElement);
  });

  it("formats a fixed ISO timestamp using the default uuu:sss format", () => {
    const el = document.createElement("umi-time");
    el.setAttribute("value", "2026-11-01T09:34:56.000Z");
    document.body.appendChild(el);

    const timeEl = el.shadowRoot?.querySelector("time");
    expect(timeEl?.textContent).toBe("143:176");
    expect(timeEl?.getAttribute("datetime")).toBe("2026-11-01T09:34:56.000Z");
  });

  it("supports custom canonical format strings and longitude context", () => {
    const el = document.createElement("umi-time");
    el.setAttribute("value", "2026-11-01T09:34:56.000Z");
    el.setAttribute("format", "yyyy-MM-ddUuuu:sss");
    el.setAttribute("longitude", "-120.64");
    document.body.appendChild(el);

    const timeEl = el.shadowRoot?.querySelector("time");
    expect(timeEl?.textContent).toBe("2026-11-01U143:176");
  });

  it("ticks live and stops interval on disconnect", () => {
    vi.setSystemTime(new Date("2026-11-01T00:00:00.000Z"));

    const el = document.createElement("umi-time");
    el.setAttribute("live", "");
    el.setAttribute("format", "Uuuu:sss");
    document.body.appendChild(el);

    expect(el.shadowRoot?.querySelector("time")?.textContent).toBe("U000:000");

    vi.advanceTimersByTime(12 * 60 * 60 * 1000);
    expect(el.shadowRoot?.querySelector("time")?.textContent).toBe("U180:000");

    const clearSpy = vi.spyOn(window, "clearInterval");
    el.remove();
    expect(clearSpy).toHaveBeenCalled();
    expect((el as UmiTimeElement)["timer"]).toBeNull();
  });

  it("renders invalid time for invalid input", () => {
    const el = document.createElement("umi-time");

    el.setAttribute("value", "not-a-time");
    document.body.appendChild(el);

    expect(el.shadowRoot?.querySelector("time")?.textContent).toBe(
      "Invalid time",
    );
  });

  it("clamps longitude values", () => {
    const el = document.createElement("umi-time");

    el.setAttribute("longitude", "999");
    document.body.appendChild(el);

    expect(el.longitude).toBe(180);
  });

  it("updates interval when update-interval is changed", () => {
    const el = document.createElement("umi-time");

    el.setAttribute("update-interval", "1000");

    expect(el.updateInterval).toBe(1000);
  });

  it("reflects value property to attribute", () => {
    const el = document.createElement("umi-time");

    el.value = "2026-11-01T09:34:56.000Z";

    expect(el.getAttribute("value")).toBe("2026-11-01T09:34:56.000Z");
  });
});
