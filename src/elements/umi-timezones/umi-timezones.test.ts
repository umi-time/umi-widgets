// src/elements/umi-timezones/umi-timezones.test.ts

import { describe, expect, it } from "vitest";

import "./index";
import { UmiTimezones } from "./umi-timezones";

describe("UmiTimezones", () => {
  it("is registered as a custom element", () => {
    expect(customElements.get("umi-timezones")).toBe(UmiTimezones);
  });

  it("defaults src to an empty string", () => {
    const timezones = document.createElement(
      "umi-timezones",
    ) as UmiTimezones;

    expect(timezones.src).toBe("");
  });

  it("updates src property and attribute", () => {
    const timezones = document.createElement(
      "umi-timezones",
    ) as UmiTimezones;

    timezones.src = "/data/timezones.json";

    expect(timezones.src).toBe("/data/timezones.json");
    expect(timezones.getAttribute("src")).toBe("/data/timezones.json");
  });

  it("updates src from attribute changes", () => {
    const timezones = document.createElement(
      "umi-timezones",
    ) as UmiTimezones;

    timezones.setAttribute("src", "/demo/data/timezones.json");

    expect(timezones.src).toBe("/demo/data/timezones.json");
  });

  it("observes the src attribute", () => {
    expect(UmiTimezones.observedAttributes).toContain("src");
  });

  it("can be created", () => {
    const timezones = document.createElement("umi-timezones");

    expect(timezones).toBeInstanceOf(UmiTimezones);
  });

  it("does not throw when connected without a src", () => {
    const timezones = document.createElement("umi-timezones");

    expect(() => {
      document.body.append(timezones);
    }).not.toThrow();
  });

  it("resets src to an empty string when removed", () => {
    const timezones = document.createElement(
      "umi-timezones",
    ) as UmiTimezones;

    timezones.setAttribute("src", "/demo/data/timezones.json");
    timezones.removeAttribute("src");

    expect(timezones.src).toBe("");
  });
});
