// src/elements/umi-tip-rotator/umi-tip-rotator.ts

import { UmiTipElement } from "../umi-tip/umi-tip";

export type UmiTipRotatorAttribute =
  | "interval"
  | "tip-delay"
  | "detail-delay"
  | "storage-key"
  | "dark";

export class UmiTipRotatorElement extends HTMLElement {
  static get observedAttributes(): readonly UmiTipRotatorAttribute[] {
    return ["interval", "tip-delay", "detail-delay", "storage-key", "dark"];
  }

  private _interval: number = 12000;
  private _tipDelay: number = 2000;
  private _detailDelay: number = 3000;
  private _storageKey: string | null = null;
  private _dark: boolean = false;
  private shadowRootRef: ShadowRoot;
  private tipElement!: HTMLDivElement;
  private focusElement!: HTMLDivElement;
  private explanationElement!: HTMLDivElement;
  private currentIndex = 0;
  private tipTimer: number | null = null;
  private focusTimer: number | null = null;
  private explanationTimer: number | null = null;

  constructor() {
    super();

    this.shadowRootRef = this.attachShadow({ mode: "open" });
  }

  get interval(): number {
    return this._interval;
  }

  set interval(value: number) {
    const clamped = Math.max(1000, value);

    this._interval = clamped;

    const attributeValue = String(clamped);

    if (this.getAttribute("interval") !== attributeValue) {
      this.setAttribute("interval", attributeValue);
    }

    this.restartTimer();
  }

  get tipDelay(): number {
    return this._tipDelay;
  }

  set tipDelay(value: number) {
    const clamped = Math.max(0, value);

    this._tipDelay = clamped;

    const attributeValue = String(clamped);

    if (this.getAttribute("tip-delay") !== attributeValue) {
      this.setAttribute("tip-delay", attributeValue);
    }
  }

  get detailDelay(): number {
    return this._detailDelay;
  }

  set detailDelay(value: number) {
    const clamped = Math.max(0, value);

    this._detailDelay = clamped;

    const attributeValue = String(clamped);

    if (this.getAttribute("detail-delay") !== attributeValue) {
      this.setAttribute("detail-delay", attributeValue);
    }
  }

  get storageKey(): string | null {
    return this._storageKey;
  }

  set storageKey(value: string | null) {
    this._storageKey = value;

    if (value === null || value === "") {
      this.removeAttribute("storage-key");
    } else if (this.getAttribute("storage-key") !== value) {
      this.setAttribute("storage-key", value);
    }
  }

  get dark(): boolean {
    return this._dark;
  }

  set dark(value: boolean) {
    this._dark = value;

    if (value) {
      this.setAttribute("dark", "");
    } else {
      this.removeAttribute("dark");
    }
  }

  connectedCallback(): void {
    this.render();
    customElements.whenDefined("umi-tip").then(() => {
      this.startTimer();
    });
  }

  disconnectedCallback(): void {
    this.stopTimer();
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    value: string | null,
  ): void {
    switch (name) {
      case "interval": {
        const parsed = Number(value);

        if (Number.isFinite(parsed) && parsed > 0) {
          this._interval = Math.max(1000, parsed);
          this.restartTimer();
        }
        break;
      }

      case "tip-delay": {
        const parsed = Number(value);

        if (Number.isFinite(parsed) && parsed >= 0) {
          this._tipDelay = Math.max(0, parsed);
        }

        break;
      }

      case "detail-delay": {
        const parsed = Number(value);

        if (Number.isFinite(parsed) && parsed >= 0) {
          this._detailDelay = Math.max(0, parsed);
        }

        break;
      }

      case "storage-key": {
        this._storageKey = value;
        break;
      }

      case "dark": {
        this._dark = value !== null;
        break;
      }
    }
  }

  private getTips(): UmiTipElement[] {
    return Array.from(this.querySelectorAll("umi-tip")) as UmiTipElement[];
  }

  private loadCurrentIndex(): void {
    if (!this._storageKey) {
      return;
    }

    try {
      const stored = localStorage.getItem(this._storageKey);

      if (stored === null) {
        return;
      }

      const index = Number(stored);

      if (Number.isInteger(index) && index >= 0) {
        this.currentIndex = index;
      }
    } catch {
      // Ignore storage failures.
    }
  }

  private saveCurrentIndex(): void {
    if (!this._storageKey) {
      return;
    }

    try {
      localStorage.setItem(this._storageKey, String(this.currentIndex));
    } catch {
      // Ignore storage failures.
    }
  }

  private refresh(): void {
    const tips = this.getTips();

    if (tips.length === 0) {
      this.focusElement.textContent = "";
      this.explanationElement.textContent = "";

      return;
    }

    if (this.currentIndex >= tips.length) {
      this.currentIndex = 0;
      this.saveCurrentIndex();
    }

    const tip = tips[this.currentIndex];

    if (!tip) {
      this.focusElement.textContent = "";
      this.explanationElement.textContent = "";

      return;
    }

    this.showTip(tip);
  }

  private showTip(tip: UmiTipElement): void {
    if (this.focusTimer) {
      clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }

    if (this.explanationTimer) {
      clearTimeout(this.explanationTimer);
      this.explanationTimer = null;
    }

    this.tipElement.classList.remove("dark");
    if (this._dark) {
      this.tipElement.classList.add("dark");
    }

    this.focusElement.classList.remove("visible");
    this.explanationElement.classList.remove("visible");

    this.focusTimer = window.setTimeout(() => {
      this.focusElement.innerHTML = tip.focusOn;
      this.focusElement.classList.add("visible");

      this.explanationTimer = window.setTimeout(() => {
        this.explanationElement.innerHTML = tip.explanation;
        this.explanationElement.classList.add("visible");
      }, this.detailDelay);
    }, this.tipDelay);
  }

  private nextTip(): void {
    const tips = this.getTips();

    if (tips.length <= 1) {
      this.refresh();
      return;
    }

    this.currentIndex = (this.currentIndex + 1) % tips.length;
    this.saveCurrentIndex();
    this.refresh();
  }

  private startTimer(): void {
    this.stopTimer();

    this.loadCurrentIndex();
    this.refresh();

    this.tipTimer = window.setInterval(() => {
      this.nextTip();
    }, this._interval);
  }

  private stopTimer(): void {
    if (this.tipTimer) {
      window.clearInterval(this.tipTimer);
      this.tipTimer = null;
    }

    if (this.focusTimer) {
      window.clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }

    if (this.explanationTimer) {
      window.clearTimeout(this.explanationTimer);
      this.explanationTimer = null;
    }
  }

  private restartTimer(): void {
    if (!this.isConnected) {
      return;
    }

    this.startTimer();
  }

  private render(): void {
    this.shadowRootRef.innerHTML = `
      <style>
        .tip-rotator {
          position: relative;
          animation: tipFloat 5s cubic-bezier(0.37, 0, 0.63, 1) infinite;
          flex-grow: 1;
          min-height: 4rem;
        }

        .tip {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 800ms ease;
          color: black;
        }
        .tip.dark {
          color: white;
        }

        .tip.active {
          opacity: 1;
        }

        .tip-focus {
          font-weight: bold;
          font-size: 1.2rem;
          opacity: 1;
        }

        .tip-explanation {
          font-size: 1rem;
          opacity: 0.9;
        }

        .tip-focus,
        .tip-explanation {
          opacity: 0;
          transition: opacity 800ms ease;
        }

        .tip-focus.visible,
        .tip-explanation.visible {
          opacity: 1;
        }

        @keyframes tipFloat {
          0% {
            transform: translateY(3px);
          }
          50% {
            transform: translateY(-3px); /* Smooth peak */
          }
          100% {
            transform: translateY(3px);  /* Smooth trough/return */
          }
        }

        @media (max-width: 480px) {
          .tip-focus {
            font-size: 1rem;
          }

          .tip-explanation {
            font-size: 0.8rem;
          }
        }
      </style>

      <div class="tip-rotator">
        <div class="tip active">
          <div class="tip-focus"></div>
          <div class="tip-explanation"></div>
        </div>
      </div>
    `;

    this.tipElement = this.shadowRootRef.querySelector(
      ".tip",
    ) as HTMLDivElement;

    this.focusElement = this.shadowRootRef.querySelector(
      ".tip-focus",
    ) as HTMLDivElement;

    this.explanationElement = this.shadowRootRef.querySelector(
      ".tip-explanation",
    ) as HTMLDivElement;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "umi-tip-rotator": UmiTipRotatorElement;
  }
}
