// src/elements/umi-options-menu/umi-options-menu.ts

import "./umi-option";

export type UmiOptionsMenuAttribute =
  | "label";

export class UmiOptionsMenuElement extends HTMLElement {
  static get observedAttributes(): readonly UmiOptionsMenuAttribute[] {
    return ["label"];
  }

  private shadowRootRef: ShadowRoot;

  private open = false;

  private buttonElement!: HTMLButtonElement;
  private menuElement!: HTMLDivElement;
  private labelElement!: HTMLDivElement;
  private optionsContainer!: HTMLDivElement;

  constructor() {
    super();

    this.shadowRootRef = this.attachShadow({
      mode: "open",
    });

    this.handleDocumentClick = this.handleDocumentClick.bind(this);
  }

  get label(): string {
    return this.getAttribute("label") ?? "Options";
  }

  connectedCallback(): void {
    this.render();
    customElements.whenDefined("umi-option").then(() => {
      this.rebuildOptions();
    });

    document.addEventListener("click", this.handleDocumentClick);
  }

  disconnectedCallback(): void {
    document.removeEventListener("click", this.handleDocumentClick);
  }

  attributeChangedCallback(name: string): void {
    if (name === "label" && this.labelElement) {
      this.labelElement.textContent = this.label;
    }
  }

  private render(): void {
    this.shadowRootRef.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
        }

        button {
          width: 28px;
          height: 28px;

          border: 1px solid #ccc;
          border-radius: 4px;

          background: white;

          cursor: pointer;

          font-size: 18px;
        }

        .menu {
          position: absolute;
          top: 36px;
          left: 0;
          width: max-content;
          max-width: 80vw;
          display: none;
          flex-direction: column;
          gap: 6px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #ccc;
          border-radius: 6px;
          box-shadow:
            0 2px 6px rgb(0 0 0 / 15%);
        }

        .label {
          font-weight: 600;
          margin-bottom: 6px;
        }

        .options label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          white-space: nowrap;
          cursor: pointer;
          user-select: none;
        }
      </style>

      <button
        type="button"
        aria-label="Options Menu">
        ☰
      </button>

      <div class="menu">
        <div class="label"></div>

        <div class="options"></div>
      </div>
    `;

    this.buttonElement = this.shadowRootRef.querySelector(
      "button",
    ) as HTMLButtonElement;

    this.menuElement = this.shadowRootRef.querySelector(
      ".menu",
    ) as HTMLDivElement;

    this.labelElement = this.shadowRootRef.querySelector(
      ".label",
    ) as HTMLDivElement;

    this.optionsContainer = this.shadowRootRef.querySelector(
      ".options",
    ) as HTMLDivElement;

    this.labelElement.textContent = this.label;

    this.buttonElement.addEventListener("click", (event) => {
      event.stopPropagation();

      this.setOpen(!this.open);
    });
  }

  private rebuildOptions(): void {
    if (!this.optionsContainer) {
      return;
    }

    this.optionsContainer.replaceChildren();

    const options = this.querySelectorAll("umi-option");

    for (const option of options) {
      const value = option.value;
      const labelText = option.label || value;
      const storageKeyPrefix = this.getAttribute("storage-key");
      const label = document.createElement("label");
      const checkbox = document.createElement("input");

      let checked = option.checked;

      if (storageKeyPrefix) {
        const stored = localStorage.getItem(`${storageKeyPrefix}:${value}`);

        if (stored !== null) {
          checked = stored === "true";
          option.checked = checked;
        }
      }

      checkbox.type = "checkbox";
      checkbox.checked = checked;

      label.append(checkbox, labelText);

      checkbox.addEventListener("change", () => {
        option.checked = checkbox.checked;
        if (storageKeyPrefix) {
          localStorage.setItem(
            `${storageKeyPrefix}:${value}`,
            String(checkbox.checked),
          );
        }

        this.dispatchEvent(
          new CustomEvent("umi-option-change", {
            detail: {
              value,
              checked: checkbox.checked,
            },
            bubbles: true,
            composed: true,
          }),
        );
      });

      this.optionsContainer.append(label);

      queueMicrotask(() => {
        this.dispatchEvent(
          new CustomEvent("umi-option-change", {
            detail: {
              value,
              checked,
            },
            bubbles: true,
            composed: true,
          }),
        );
      });
    }
  }

  private setOpen(open: boolean): void {
    this.open = open;

    this.menuElement.style.display = open ? "flex" : "none";
  }

  private handleDocumentClick(event: MouseEvent): void {
    const path = event.composedPath();

    if (!path.includes(this)) {
      this.setOpen(false);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-options-menu": UmiOptionsMenuElement;
  }
}
