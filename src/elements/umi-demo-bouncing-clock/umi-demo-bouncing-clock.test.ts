import { afterEach, describe, expect, it } from "vitest";

import "./index";

describe("umi-demo-bouncing-clock", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registers the custom element", () => {
    expect(customElements.get("umi-demo-bouncing-clock")).toBeDefined();
  });

  it("creates the component", () => {
    const element = document.createElement("umi-demo-bouncing-clock");

    expect(element.constructor.name).toBe("UmiDemoBouncingClock");
  });

  it("renders the expected child components", () => {
    const element = document.createElement("umi-demo-bouncing-clock");

    document.body.appendChild(element);

    expect(element.shadowRoot?.querySelector("umi-clock")).not.toBeNull();

    expect(
      element.shadowRoot?.querySelector("umi-time-explorer"),
    ).not.toBeNull();

    expect(element.shadowRoot?.querySelector("umi-tip-rotator")).not.toBeNull();
  });

  it("propagates dark mode", () => {
    const element = document.createElement("umi-demo-bouncing-clock");

    element.setAttribute("dark", "");
    document.body.appendChild(element);

    const clock = element.shadowRoot?.querySelector("umi-clock");
    const explorer = element.shadowRoot?.querySelector("umi-time-explorer");
    const tips = element.shadowRoot?.querySelector("umi-tip-rotator");

    expect(clock?.hasAttribute("dark")).toBe(true);
    expect(explorer?.hasAttribute("dark")).toBe(true);
    expect(tips?.hasAttribute("dark")).toBe(true);
  });
});
