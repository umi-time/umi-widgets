// src/elements/umi-tip/umi-tip.test.ts

import { describe, expect, it } from "vitest";

import "./index";
import { UmiTipElement } from "./umi-tip";

describe("UmiTipElement", () => {
  it("is registered as a custom element", () => {
    expect(customElements.get("umi-tip")).toBe(UmiTipElement);
  });

  it("initializes with default values", () => {
    const tip = document.createElement("umi-tip") as UmiTipElement;

    expect(tip.focusOn).toBe("");
    expect(tip.explanation).toBe("");
  });

  it("updates focusOn property and attribute", () => {
    const tip = document.createElement("umi-tip") as UmiTipElement;

    tip.focusOn = "Notice the dial.";

    expect(tip.focusOn).toBe("Notice the dial.");
    expect(tip.getAttribute("focus-on")).toBe("Notice the dial.");
  });

  it("updates explanation property and attribute", () => {
    const tip = document.createElement("umi-tip") as UmiTipElement;

    tip.explanation = "It rotates with longitude.";

    expect(tip.explanation).toBe("It rotates with longitude.");
    expect(tip.getAttribute("explanation")).toBe("It rotates with longitude.");
  });

  it("updates properties from attributes", () => {
    const tip = document.createElement("umi-tip") as UmiTipElement;

    tip.setAttribute("focus-on", "Notice the bezel.");
    tip.setAttribute(
      "explanation",
      "It provides a reference for your local solar day.",
    );

    expect(tip.focusOn).toBe("Notice the bezel.");
    expect(tip.explanation).toBe(
      "It provides a reference for your local solar day.",
    );
  });

  it("dispatches umi-tip-change when focusOn changes", () => {
    const tip = document.createElement("umi-tip") as UmiTipElement;

    let count = 0;

    tip.addEventListener("umi-tip-change", () => {
      count += 1;
    });

    tip.setAttribute("focus-on", "Notice the colored ring.");

    expect(count).toBe(1);
  });

  it("dispatches umi-tip-change when explanation changes", () => {
    const tip = document.createElement("umi-tip") as UmiTipElement;

    let count = 0;

    tip.addEventListener("umi-tip-change", () => {
      count += 1;
    });

    tip.setAttribute("explanation", "It shows daylight, twilight, and night.");

    expect(count).toBe(1);
  });

  it("dispatches a bubbling composed event", () => {
    const tip = document.createElement("umi-tip") as UmiTipElement;

    let event: Event | null = null;

    tip.addEventListener("umi-tip-change", (e) => {
      event = e;
    });

    tip.setAttribute("focus-on", "Notice the colored ring.");

    expect(event).not.toBeNull();
    expect(event!.bubbles).toBe(true);
    expect(event!.composed).toBe(true);
  });
});
