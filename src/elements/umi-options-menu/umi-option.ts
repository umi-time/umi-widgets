// src/elements/umi-options-menu/umi-option.ts

/**
 * Supported attributes for the <umi-option> element.
 */
export type UmiOptionAttribute = "value" | "label" | "checked";

/**
 * Defines an option within a <umi-options-menu> element.
 *
 * This is a non-visual data element that supplies the value, label,
 * and selected state for a menu option.
 */
export class UmiOption extends HTMLElement {
  static get observedAttributes(): readonly UmiOptionAttribute[] {
    return ["value", "label", "checked"];
  }

  private _value = "";
  private _label = "";
  private _checked = false;

  /** Option value emitted when the option is selected. */
  public get value(): string {
    return this._value;
  }

  public set value(value: string) {
    this._value = value;

    if (this.getAttribute("value") !== value) {
      this.setAttribute("value", value);
    }
  }

  /** Display label shown for the option. */
  public get label(): string {
    return this._label !== "" ? this._label : (this.textContent?.trim() ?? "");
  }

  public set label(value: string) {
    this._label = value;

    if (this.getAttribute("label") !== value) {
      this.setAttribute("label", value);
    }
  }

  /** Indicates whether the option is currently selected. */
  public get checked(): boolean {
    return this._checked;
  }

  public set checked(value: boolean) {
    this._checked = value;

    if (this.hasAttribute("checked") !== value) {
      this.toggleAttribute("checked", value);
    }
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    value: string | null,
  ): void {
    switch (name as UmiOptionAttribute) {
      case "value":
        this._value = value ?? "";
        break;

      case "label":
        this._label = value ?? "";
        break;

      case "checked":
        this._checked = value === "" || value === "true";
        break;
    }
  }

  connectedCallback(): void {
    this.hidden = true;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-option": UmiOption;
  }
}
