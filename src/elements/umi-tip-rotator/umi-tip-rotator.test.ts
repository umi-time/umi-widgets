// src/elements/umi-tip-rotator/umi-tip-rotator.test.ts

import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";

import "../umi-tip/index";
import "./index";
import { UmiTip } from "../umi-tip";
import { UmiTipRotator } from "./index";

describe("UmiTipRotator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("is registered as a custom element", () => {
    expect(customElements.get("umi-tip-rotator")).toBe(UmiTipRotator);
  });

  it("defaults interval to 12000ms", () => {
    const rotator = document.createElement(
      "umi-tip-rotator",
    ) as UmiTipRotator;

    expect(rotator.interval).toBe(12000);
  });

  it("updates interval property and attribute", () => {
    const rotator = document.createElement(
      "umi-tip-rotator",
    ) as UmiTipRotator;

    rotator.interval = 5000;

    expect(rotator.interval).toBe(5000);
    expect(rotator.getAttribute("interval")).toBe("5000");
  });

  it("reads interval from attribute", () => {
    const rotator = document.createElement(
      "umi-tip-rotator",
    ) as UmiTipRotator;

    rotator.setAttribute("interval", "7000");

    expect(rotator.interval).toBe(7000);
  });

  it("renders the first tip when connected", async () => {
    const rotator = document.createElement(
      "umi-tip-rotator",
    ) as UmiTipRotator;

    const tip = document.createElement("umi-tip") as UmiTip;

    tip.focusOn = "Notice the dial.";
    tip.explanation = "It rotates with longitude.";

    rotator.append(tip);

    document.body.append(rotator);

    await Promise.resolve();

    vi.advanceTimersByTime(2500);

    const focusOn = rotator.shadowRoot?.querySelector(".tip-focus");
    expect(focusOn?.textContent).toBe("Notice the dial.");

    vi.advanceTimersByTime(3000);

    const explanation = rotator.shadowRoot?.querySelector(".tip-explanation");
    expect(explanation?.textContent).toBe("It rotates with longitude.");

    rotator.remove();
  });

  it("renders empty content when no tips are present", async () => {
    const rotator = document.createElement(
      "umi-tip-rotator",
    ) as UmiTipRotator;

    document.body.append(rotator);

    await Promise.resolve();

    vi.advanceTimersByTime(2000);

    const focusOn = rotator.shadowRoot?.querySelector(".tip-focus");
    expect(focusOn?.textContent).toBe("");

    vi.advanceTimersByTime(3000);

    const explanation = rotator.shadowRoot?.querySelector(".tip-explanation");
    expect(explanation?.textContent).toBe("");

    rotator.remove();
  });

  it("supports multiple tips", async () => {
    const rotator = document.createElement(
      "umi-tip-rotator",
    ) as UmiTipRotator;

    const tip1 = document.createElement("umi-tip") as UmiTip;

    tip1.focusOn = "First";
    tip1.explanation = "First explanation";

    const tip2 = document.createElement("umi-tip") as UmiTip;

    tip2.focusOn = "Second";
    tip2.explanation = "Second explanation";

    rotator.append(tip1, tip2);

    document.body.append(rotator);

    await Promise.resolve();

    vi.advanceTimersByTime(2000);

    const focusOn = rotator.shadowRoot?.querySelector(".tip-focus");
    expect(focusOn?.textContent).toBe("First");

    vi.advanceTimersByTime(3000);

    const explanation = rotator.shadowRoot?.querySelector(".tip-explanation");
    expect(explanation?.textContent).toBe("First explanation");

    rotator.remove();
  });

  it("rotates to the next tip after the interval", async () => {
    const rotator = document.createElement(
      "umi-tip-rotator",
    ) as UmiTipRotator;

    rotator.interval = 1000;
    rotator.tipDelay = 0;
    rotator.detailDelay = 0;

    const tip1 = document.createElement("umi-tip");
    tip1.focusOn = "First";

    const tip2 = document.createElement("umi-tip");
    tip2.focusOn = "Second";

    rotator.append(tip1, tip2);
    document.body.append(rotator);

    await Promise.resolve();

    vi.advanceTimersByTime(1);

    expect(rotator.shadowRoot?.querySelector(".tip-focus")?.textContent).toBe(
      "First",
    );

    vi.advanceTimersByTime(1000);

    expect(rotator.shadowRoot?.querySelector(".tip-focus")?.textContent).toBe(
      "Second",
    );
  });

  it("applies dark mode styling", async () => {
    const rotator = document.createElement(
      "umi-tip-rotator",
    ) as UmiTipRotator;

    rotator.dark = true;

    const tip = document.createElement("umi-tip");
    tip.focusOn = "Dark mode";
    tip.explanation = "Test";

    rotator.append(tip);

    document.body.append(rotator);

    await Promise.resolve();

    vi.advanceTimersByTime(2000);

    expect(
      rotator.shadowRoot?.querySelector(".tip")?.classList.contains("dark"),
    ).toBe(true);
  });
});
