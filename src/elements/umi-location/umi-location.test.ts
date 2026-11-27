// src/elements/umi-location/umi-location.test.ts

import { describe, expect, it, vi } from "vitest";

import "./index";
import { UmiLocation } from "./umi-location";

describe("UmiLocation", () => {
  it("registers the custom element", () => {
    expect(customElements.get("umi-location")).toBe(UmiLocation);
  });

  it("uses sensible defaults", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    expect(location.label).toBe("");
    expect(location.latitude).toBe(0);
    expect(location.longitude).toBe(0);
    expect(location.color).toBe("");
  });

  it("reads label attribute", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.setAttribute("label", "Tokyo");

    expect(location.label).toBe("Tokyo");
  });

  it("reads latitude attribute", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.setAttribute("latitude", "35.6764");

    expect(location.latitude).toBeCloseTo(35.6764);
  });

  it("reads longitude attribute", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.setAttribute("longitude", "139.65");

    expect(location.longitude).toBeCloseTo(139.65);
  });

  it("reads color attribute", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.setAttribute("color", "#ff0000");

    expect(location.color).toBe("#ff0000");
  });

  it("updates label through property setter", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.label = "London";

    expect(location.label).toBe("London");
    expect(location.getAttribute("label")).toBe("London");
  });

  it("updates latitude through property setter", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.latitude = 51.5072;

    expect(location.latitude).toBeCloseTo(51.5072);
    expect(location.getAttribute("latitude")).toBe("51.5072");
  });

  it("updates longitude through property setter", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.longitude = -0.1276;

    expect(location.longitude).toBeCloseTo(-0.1276);
    expect(location.getAttribute("longitude")).toBe("-0.1276");
  });

  it("updates color through property setter", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.color = "#00ff00";

    expect(location.color).toBe("#00ff00");
    expect(location.getAttribute("color")).toBe("#00ff00");
  });

  it("clamps latitude values above the maximum", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.setAttribute("latitude", "999");

    expect(location.latitude).toBe(90);
  });

  it("clamps latitude values below the minimum", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.setAttribute("latitude", "-999");

    expect(location.latitude).toBe(-90);
  });

  it("ignores invalid latitude values", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.latitude = 35;
    location.setAttribute("latitude", "not-a-number");

    expect(location.latitude).toBe(35);
  });

  it("ignores invalid longitude values", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.longitude = 100;
    location.setAttribute("longitude", "not-a-number");

    expect(location.longitude).toBe(100);
  });

  it("dispatches a change event when label changes", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    const listener = vi.fn();

    location.addEventListener("umi-location-change", listener);
    location.setAttribute("label", "Tokyo");

    expect(listener).toHaveBeenCalledOnce();
  });

  it("dispatches a change event when latitude changes", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    const listener = vi.fn();

    location.addEventListener("umi-location-change", listener);
    location.setAttribute("latitude", "35.6764");

    expect(listener).toHaveBeenCalledOnce();
  });

  it("dispatches a change event when longitude changes", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    const listener = vi.fn();

    location.addEventListener("umi-location-change", listener);
    location.setAttribute("longitude", "139.65");

    expect(listener).toHaveBeenCalledOnce();
  });

  it("dispatches a bubbling composed event", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    let event: Event | null = null;

    location.addEventListener("umi-location-change", (e) => {
      event = e;
    });

    location.setAttribute("label", "Tokyo");

    expect(event).not.toBeNull();
    expect(event!.bubbles).toBe(true);
    expect(event!.composed).toBe(true);
  });

  it("reads timezone attribute", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.setAttribute("timezone", "America/Los_Angeles");

    expect(location.timezone).toBe("America/Los_Angeles");
  });

  it("updates timezone through property setter", () => {
    const location = document.createElement(
      "umi-location",
    ) as UmiLocation;

    location.timezone = "America/Los_Angeles";

    expect(location.timezone).toBe("America/Los_Angeles");
    expect(location.getAttribute("timezone")).toBe("America/Los_Angeles");
  });
});
