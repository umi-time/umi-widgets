import { afterEach, describe, expect, it } from "vitest";

import "./index";

describe("umi-options-menu", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the label", () => {
    const element = document.createElement("umi-options-menu");

    element.setAttribute("label", "Map Layers");
    document.body.append(element);

    const title = element.shadowRoot?.querySelector(".label");

    expect(title?.textContent).toBe("Map Layers");

    document.body.removeChild(element);
  });

  it("creates a checkbox for each umi-option", async () => {
    const element = document.createElement("umi-options-menu");

    element.innerHTML = `
      <umi-option
        value="latitude"
        checked>
        Latitude Lines
      </umi-option>

      <umi-option
        value="longitude">
        Longitude Lines
      </umi-option>
    `;

    document.body.append(element);

    await customElements.whenDefined("umi-option");
    await Promise.resolve();

    const checkboxes = element.shadowRoot?.querySelectorAll(
      "input[type='checkbox']",
    );

    expect(checkboxes?.length).toBe(2);

    document.body.removeChild(element);
  });

  it("honors checked state", async () => {
    const element = document.createElement("umi-options-menu");

    element.innerHTML = `
      <umi-option
        value="latitude"
        checked>
        Latitude Lines
      </umi-option>
    `;

    document.body.append(element);

    await customElements.whenDefined("umi-option");
    await Promise.resolve();

    const checkbox = element.shadowRoot?.querySelector(
      "input[type='checkbox']",
    ) as HTMLInputElement;

    expect(checkbox.checked).toBe(true);

    document.body.removeChild(element);
  });

  it("uses option text as label", async () => {
    const element = document.createElement("umi-options-menu");

    element.innerHTML = `
      <umi-option
        value="latitude">
        Latitude Lines
      </umi-option>
    `;

    document.body.append(element);

    await customElements.whenDefined("umi-option");
    await Promise.resolve();

    const label = element.shadowRoot?.querySelector("label");

    expect(label?.textContent).toContain("Latitude Lines");

    document.body.removeChild(element);
  });

  it("emits umi-option-change", async () => {
    const element = document.createElement("umi-options-menu");

    element.innerHTML = `
      <umi-option
        value="latitude">
        Latitude Lines
      </umi-option>
    `;

    document.body.append(element);

    await customElements.whenDefined("umi-option");
    await Promise.resolve();

    let received:
      | {
          value: string;
          checked: boolean;
        }
      | undefined;

    element.addEventListener("umi-option-change", (event) => {
      received = (
        event as CustomEvent<{
          value: string;
          checked: boolean;
        }>
      ).detail;
    });

    const checkbox = element.shadowRoot?.querySelector(
      "input[type='checkbox']",
    ) as HTMLInputElement;

    checkbox.checked = true;

    checkbox.dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );

    expect(received).toEqual({
      value: "latitude",
      checked: true,
    });

    document.body.removeChild(element);
  });

  it("synchronizes checked attribute when checkbox changes", async () => {
    const element = document.createElement("umi-options-menu");

    await customElements.whenDefined("umi-option");
    await Promise.resolve();

    element.innerHTML = `
      <umi-option
        value="latitude">
        Latitude Lines
      </umi-option>
    `;

    document.body.append(element);

    await customElements.whenDefined("umi-option");
    await Promise.resolve();

    const option = element.querySelector("umi-option") as HTMLElement;

    const checkbox = element.shadowRoot?.querySelector(
      "input[type='checkbox']",
    ) as HTMLInputElement;

    checkbox.checked = true;

    checkbox.dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );

    expect(option.hasAttribute("checked")).toBe(true);

    document.body.removeChild(element);
  });

  it("opens when button is clicked", async () => {
    const element = document.createElement("umi-options-menu");

    document.body.append(element);

    await customElements.whenDefined("umi-option");
    await Promise.resolve();

    const button = element.shadowRoot?.querySelector(
      "button",
    ) as HTMLButtonElement;

    const menu = element.shadowRoot?.querySelector(".menu") as HTMLDivElement;

    button.click();

    expect(menu.style.display).toBe("flex");

    document.body.removeChild(element);
  });

  it("toggles closed when button clicked twice", async () => {
    const element = document.createElement("umi-options-menu");

    document.body.append(element);

    await customElements.whenDefined("umi-option");
    await Promise.resolve();

    const button = element.shadowRoot?.querySelector(
      "button",
    ) as HTMLButtonElement;

    const menu = element.shadowRoot?.querySelector(".menu") as HTMLDivElement;

    button.click();
    button.click();

    expect(menu.style.display).toBe("none");

    document.body.removeChild(element);
  });

  it("uses Options as the default label", async () => {
    const element = document.createElement("umi-options-menu");

    document.body.append(element);

    await customElements.whenDefined("umi-option");
    await Promise.resolve();

    const title = element.shadowRoot?.querySelector(".label");

    expect(title?.textContent).toBe("Options");
  });

  it("updates the label when the attribute changes", async () => {
    const element = document.createElement("umi-options-menu");

    document.body.append(element);

    await customElements.whenDefined("umi-option");
    await Promise.resolve();

    element.setAttribute("label", "Display Options");

    const title = element.shadowRoot?.querySelector(".label");

    expect(title?.textContent).toBe("Display Options");
  });

  it("closes when clicking outside the menu", async () => {
    const element = document.createElement("umi-options-menu");

    document.body.append(element);

    await customElements.whenDefined("umi-option");
    await Promise.resolve();

    const button = element.shadowRoot?.querySelector(
      "button",
    ) as HTMLButtonElement;

    const menu = element.shadowRoot?.querySelector(".menu") as HTMLDivElement;

    button.click();

    expect(menu.style.display).toBe("flex");

    document.body.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        composed: true,
      }),
    );

    expect(menu.style.display).toBe("none");
  });
});
