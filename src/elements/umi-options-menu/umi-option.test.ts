import { describe, expect, it } from "vitest";

import "./index";
import { UmiOption } from "./umi-option";

describe("UmiOption", () => {
  it("registers the custom element", () => {
    expect(customElements.get("umi-option")).toBe(
      UmiOption,
    );
  });

  it("uses sensible defaults", () => {
    const option = document.createElement(
      "umi-option",
    ) as UmiOption;

    expect(option.value).toBe("");
    expect(option.label).toBe("");
    expect(option.checked).toBe(false);
  });

  it("reflects value property to attribute", () => {
    const option = document.createElement(
      "umi-option",
    ) as UmiOption;

    option.value = "seconds";

    expect(option.getAttribute("value")).toBe(
      "seconds",
    );
  });

  it("reflects label property to attribute", () => {
    const option = document.createElement(
      "umi-option",
    ) as UmiOption;

    option.label = "Show Seconds";

    expect(option.getAttribute("label")).toBe(
      "Show Seconds",
    );
  });

  it("reflects checked property to attribute", () => {
    const option = document.createElement(
      "umi-option",
    ) as UmiOption;

    option.checked = true;

    expect(option.hasAttribute("checked")).toBe(
      true,
    );

    option.checked = false;

    expect(option.hasAttribute("checked")).toBe(
      false,
    );
  });

  it("uses text content as a label fallback", () => {
    const option = document.createElement(
      "umi-option",
    ) as UmiOption;

    option.textContent = "Show Seconds";

    expect(option.label).toBe("Show Seconds");
  });

  it("hides itself when connected", () => {
    const option = document.createElement(
      "umi-option",
    ) as UmiOption;

    document.body.append(option);

    expect(option.hidden).toBe(true);

    option.remove();
  });
});