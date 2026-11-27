// src/elements/umi-time-explorer/umi-time-explorer.test.ts

import { afterEach, describe, expect, it } from "vitest";

import "./index";
import { UmiTimeChangeDetail } from "./umi-time-explorer";

describe("umi-time-explorer", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("defaults to datetime mode", () => {
    const element = document.createElement("umi-time-explorer");

    expect(element.mode).toBe("datetime");
  });

  it("shows only day controls in day mode", () => {
    const element = document.createElement("umi-time-explorer");

    element.setAttribute("mode", "day");

    document.body.append(element);

    const dayControl = element.shadowRoot!.querySelector(
      ".day-control",
    ) as HTMLDivElement;

    const timeControl = element.shadowRoot!.querySelector(
      ".time-control",
    ) as HTMLDivElement;

    expect(dayControl.hidden).toBe(false);
    expect(timeControl.hidden).toBe(true);
  });

  it("shows only time controls in time mode", () => {
    const element = document.createElement("umi-time-explorer");

    element.setAttribute("mode", "time");

    document.body.append(element);

    const dayControl = element.shadowRoot!.querySelector(
      ".day-control",
    ) as HTMLDivElement;

    const timeControl = element.shadowRoot!.querySelector(
      ".time-control",
    ) as HTMLDivElement;

    expect(dayControl.hidden).toBe(true);
    expect(timeControl.hidden).toBe(false);
  });

  it("renders a umi-readout component", () => {
    const element = document.createElement("umi-time-explorer");

    document.body.append(element);

    const umiDisplay = element.shadowRoot!.querySelector("umi-readout");

    expect(umiDisplay).not.toBeNull();
  });

  it("emits umi-time-change when day slider changes", () => {
    const element = document.createElement("umi-time-explorer");

    document.body.append(element);

    let detail: UmiTimeChangeDetail | undefined;;

    element.addEventListener("umi-time-change", (event) => {
      detail = (event as CustomEvent<UmiTimeChangeDetail>).detail;
    });

    const slider = element.shadowRoot!.querySelector(
      ".day-slider",
    ) as HTMLInputElement;

    slider.value = "42";

    slider.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    expect(detail).toBeDefined();
    if (detail) {
      expect(detail.offset).toBe(42 * 360);
    }
  });

  it("emits umi-time-change when time slider changes", () => {
    const element = document.createElement("umi-time-explorer");

    document.body.append(element);

    let detail: UmiTimeChangeDetail | undefined;

    element.addEventListener("umi-time-change", (event) => {
      detail = (event as CustomEvent<UmiTimeChangeDetail>).detail;
    });

    const slider = element.shadowRoot!.querySelector(
      ".time-slider",
    ) as HTMLInputElement;

    slider.value = "-90";

    slider.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    expect(detail).toBeDefined();
    if (detail) {
      expect(detail.offset).toBe(-90);
    }
  });

  it("updates day label when day slider changes", () => {
    const element = document.createElement("umi-time-explorer");

    document.body.append(element);

    const slider = element.shadowRoot!.querySelector(
      ".day-slider",
    ) as HTMLInputElement;

    slider.value = "12";

    slider.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    const dayValue = element.shadowRoot!.querySelector(
      ".day-value",
    ) as HTMLSpanElement;

    expect(dayValue.textContent).toContain("+12");
  });

  it("updates time label when time slider changes", () => {
    const element = document.createElement("umi-time-explorer");

    document.body.append(element);

    const slider = element.shadowRoot!.querySelector(
      ".time-slider",
    ) as HTMLInputElement;

    slider.value = "60";

    slider.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    const timeValue = element.shadowRoot!.querySelector(
      ".time-value",
    ) as HTMLSpanElement;

    expect(timeValue.textContent).toContain("+60");
  });

  it("live button resets both sliders", () => {
    const element = document.createElement("umi-time-explorer");

    document.body.append(element);

    const daySlider = element.shadowRoot!.querySelector(
      ".day-slider",
    ) as HTMLInputElement;

    const timeSlider = element.shadowRoot!.querySelector(
      ".time-slider",
    ) as HTMLInputElement;

    daySlider.value = "25";
    daySlider.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    timeSlider.value = "60";
    timeSlider.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    const button = element.shadowRoot!.querySelector(
      ".live-button",
    ) as HTMLButtonElement;

    let detail: UmiTimeChangeDetail | undefined;

    element.addEventListener("umi-time-change", (event) => {
      detail = (event as CustomEvent<UmiTimeChangeDetail>).detail;
    });
    button.click();

    expect(daySlider.value).toBe("0");
    expect(timeSlider.value).toBe("0");
    if (detail) {
      expect(detail.offset).toBe(0);
    }

    const dayValue = element.shadowRoot!.querySelector(
      ".day-value",
    ) as HTMLSpanElement;

    const timeValue = element.shadowRoot!.querySelector(
      ".time-value",
    ) as HTMLSpanElement;

    expect(dayValue.textContent).toBe("Today");
    expect(timeValue.textContent).toBe("Now");
  });

  it("provides a value attribute to umi-readout", () => {
    const element = document.createElement("umi-time-explorer");

    document.body.append(element);

    const umiReadout = element.shadowRoot!.querySelector(
      "umi-readout",
    ) as HTMLElement;

    const value = umiReadout.getAttribute("value");

    expect(value).not.toBeNull();
  });

  it("emits a bubbling composed event", () => {
    const element = document.createElement("umi-time-explorer");

    document.body.append(element);

    let received: CustomEvent<UmiTimeChangeDetail> | undefined;

    element.addEventListener("umi-time-change", (event) => {
      received = event as CustomEvent<UmiTimeChangeDetail>;
    });

    const slider = element.shadowRoot!.querySelector(
      ".day-slider",
    ) as HTMLInputElement;

    slider.value = "1";

    slider.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    expect(received).toBeDefined();
    expect(received!.bubbles).toBe(true);
    expect(received!.composed).toBe(true);
  });

  it("shows both controls in datetime mode", () => {
    const element = document.createElement("umi-time-explorer");

    element.mode = "datetime";
    document.body.append(element);

    const dayControl = element.shadowRoot!.querySelector(
      ".day-control",
    ) as HTMLDivElement;

    const timeControl = element.shadowRoot!.querySelector(
      ".time-control",
    ) as HTMLDivElement;

    expect(dayControl.hidden).toBe(false);
    expect(timeControl.hidden).toBe(false);
  });

  it("normalizes invalid modes to datetime", () => {
    const element = document.createElement("umi-time-explorer");

    element.setAttribute("mode", "banana");

    document.body.append(element);

    expect(element.mode).toBe("datetime");
  });

  it("shows negative day offsets", () => {
    const element = document.createElement("umi-time-explorer");

    document.body.append(element);

    const slider = element.shadowRoot!.querySelector(
      ".day-slider",
    ) as HTMLInputElement;

    slider.value = "-12";

    slider.dispatchEvent(
      new Event("input", {
        bubbles: true,
      }),
    );

    const dayValue = element.shadowRoot!.querySelector(
      ".day-value",
    ) as HTMLSpanElement;

    expect(dayValue.textContent).toContain("-12");
  });

  it("starts at Today and Now", () => {
    const element = document.createElement("umi-time-explorer");

    document.body.append(element);

    const dayValue = element.shadowRoot!.querySelector(
      ".day-value",
    ) as HTMLSpanElement;

    const timeValue = element.shadowRoot!.querySelector(
      ".time-value",
    ) as HTMLSpanElement;

    expect(dayValue.textContent).toBe("Today");
    expect(timeValue.textContent).toBe("Now");
  });
});
