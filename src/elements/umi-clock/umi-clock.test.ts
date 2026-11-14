import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UmiClock } from "./index";

describe("<umi-clock>", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("registers the custom element safely", () => {
    expect(customElements.get("umi-clock")).toBe(UmiClock);
  });

  it("creates Shadow DOM with solar ring and SVG dial", () => {
    const clock = document.createElement("umi-clock");
    document.body.appendChild(clock);

    expect(clock.shadowRoot).not.toBeNull();
    expect(clock.shadowRoot?.querySelector("#solarRing")).not.toBeNull();
    expect(clock.shadowRoot?.querySelector("#clockSvg")).not.toBeNull();
  });

  it("clamps latitude and longitude within valid bounds", () => {
    const clock = document.createElement("umi-clock");
    document.body.appendChild(clock);

    clock.setLocation(120, -250);
    expect(clock.latitude).toBe(90);
    expect(clock.longitude).toBe(-180);

    clock.setAttribute("latitude", "-95");
    clock.setAttribute("longitude", "195");
    expect(clock.latitude).toBe(-90);
    expect(clock.longitude).toBe(180);
  });

  it("toggles dark mode styles and bezel classes", () => {
    const clock = document.createElement("umi-clock");
    document.body.appendChild(clock);

    clock.setAttribute("dark", "true");
    expect(clock.darkMode).toBe(true);
    expect(
      clock.shadowRoot?.querySelector("#bezelGroup")?.classList.contains("dark-mode"),
    ).toBe(true);

    clock.setAttribute("dark", "false");
    expect(clock.darkMode).toBe(false);
    expect(
      clock.shadowRoot?.querySelector("#bezelGroup")?.classList.contains("dark-mode"),
    ).toBe(false);
  });

  it("stops the animation loop when disconnected from the DOM", () => {
    const clock = document.createElement("umi-clock");
    document.body.appendChild(clock);
    expect(window.requestAnimationFrame).toHaveBeenCalled();

    clock.remove();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});
