// src/elements/umi-options-menu/umi-option.ts

export type UmiOptionAttribute = "value" | "label" | "checked";

export class UmiOptionElement extends HTMLElement {
  static get observedAttributes(): readonly UmiOptionAttribute[] {
    return ["value", "label", "checked"];
  }

  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  get label(): string {
    return this.getAttribute("label") ?? this.textContent?.trim() ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get checked(): boolean {
    return this.hasAttribute("checked");
  }

  set checked(value: boolean) {
    if (value) {
      this.setAttribute("checked", "");
    } else {
      this.removeAttribute("checked");
    }
  }

  connectedCallback(): void {
    this.hidden = true;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-option": UmiOptionElement;
  }
}
