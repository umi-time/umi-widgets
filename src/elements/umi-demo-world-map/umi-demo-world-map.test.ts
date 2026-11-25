import { afterEach, describe, expect, it } from "vitest";

import "./index";

describe("umi-demo-world-map", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registers the custom element", () => {
    expect(customElements.get("umi-demo-world-map")).toBeDefined();
  });

  it("creates the component", () => {
    const element = document.createElement("umi-demo-world-map");

    expect(element.constructor.name).toBe("UmiDemoWorldMap");
  });

  it("renders the expected child components", () => {
    const element = document.createElement("umi-demo-world-map");

    document.body.appendChild(element);

    expect(element.shadowRoot?.querySelector("umi-world-map")).not.toBeNull();

    expect(
      element.shadowRoot?.querySelector("umi-time-explorer"),
    ).not.toBeNull();

    expect(element.shadowRoot?.querySelector("umi-tip-rotator")).not.toBeNull();

    expect(
      element.shadowRoot?.querySelector("umi-options-menu"),
    ).not.toBeNull();
  });
});
