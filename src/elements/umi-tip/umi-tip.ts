/**
 * Supported attributes for the <umi-tip> element.
 */
export type UmiTipAttribute = "focus-on" | "explanation";

/**
 * Defines a single instructional tip for use within a <umi-tip-rotator>.
 *
 * This is a non-visual data element that supplies the focus topic and
 * explanatory text displayed by the parent tip rotator.
 *
 * @event umi-tip-change Fired when the tip content changes.
 */
export class UmiTip extends HTMLElement {
  static get observedAttributes(): readonly UmiTipAttribute[] {
    return ["focus-on", "explanation"];
  }

  private _focusOn = "";
  private _explanation = "";

  /** Topic or feature highlighted by the tip. */
  public get focusOn(): string {
    return this._focusOn;
  }

  public set focusOn(value: string) {
    this._focusOn = value;

    if (this.getAttribute("focus-on") !== value) {
      this.setAttribute("focus-on", value);
    }
  }

  /** Explanatory text displayed by the tip rotator. */
  public get explanation(): string {
    return this._explanation;
  }

  public set explanation(value: string) {
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
    switch (name as UmiTipAttribute) {
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
    "umi-tip": UmiTip;
  }
}
