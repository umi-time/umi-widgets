export type UmiTipAttribute = "focus-on" | "explanation";

export class UmiTipElement extends HTMLElement {
  static get observedAttributes(): readonly UmiTipAttribute[] {
    return ["focus-on", "explanation"];
  }

  private _focusOn = "";
  private _explanation = "";

  get focusOn(): string {
    return this._focusOn;
  }

  set focusOn(value: string) {
    this._focusOn = value;

    if (this.getAttribute("focus-on") !== value) {
      this.setAttribute("focus-on", value);
    }
  }

  get explanation(): string {
    return this._explanation;
  }

  set explanation(value: string) {
    this._explanation = value;

    if (this.getAttribute("explanation") !== value) {
      this.setAttribute("explanation", value);
    }
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    value: string | null,
  ): void {
    switch (name) {
      case "focus-on":
        this._focusOn = value ?? "";
        break;

      case "explanation":
        this._explanation = value ?? "";
        break;
    }

    this.dispatchEvent(
      new CustomEvent("umi-tip-change", {
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-tip": UmiTipElement;
  }
}
