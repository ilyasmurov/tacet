// <tacet-digits> — a number that changes, for projects without React.
//
// The element itself is the host: its children are the digit slots the
// controller from tacet-core drives. A new `value` animates; any other
// attribute redraws the number at once.

import {
  createDigits,
  type DigitsController, type DigitsOptions, type DigitsTransition, type IconVariant,
} from "tacet-core";

export class TacetDigitsElement extends HTMLElement {
  static observedAttributes = [
    "value", "size", "variant", "solid", "stroke-width", "absolute-stroke", "accent-color", "transition", "label",
  ];

  #digits: DigitsController | null = null;

  connectedCallback(): void {
    // Slots line up on one baseline; a stylesheet can still override both.
    if (!this.style.display) this.style.display = "inline-flex";
    if (!this.style.alignItems) this.style.alignItems = "center";
    this.setAttribute("role", "img");
    this.#digits = createDigits(this, this.getAttribute("value") ?? "", this.#opts());
    this.#label();
  }

  disconnectedCallback(): void {
    this.#digits?.destroy();
    this.#digits = null;
  }

  attributeChangedCallback(name: string): void {
    if (!this.#digits) return;
    if (name === "value") this.#digits.set(this.getAttribute("value") ?? "");
    else if (name !== "label") this.#digits.update(this.#opts());
    this.#label();
  }

  #num(attr: string): number | undefined {
    const raw = this.getAttribute(attr);
    if (raw == null || raw === "") return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  }

  #bool(attr: string): boolean | undefined {
    if (!this.hasAttribute(attr)) return undefined;
    return this.getAttribute(attr) !== "false";
  }

  /**
   * Every option, present or not. A removed attribute has to come through as
   * undefined, or update() would keep the value it had before.
   */
  #opts(): DigitsOptions {
    return {
      size: this.#num("size"),
      variant: (this.getAttribute("variant") as IconVariant | null) ?? undefined,
      solid: this.#bool("solid"),
      strokeWidth: this.#num("stroke-width"),
      absoluteStroke: this.#bool("absolute-stroke"),
      accentColor: this.getAttribute("accent-color") ?? undefined,
      transition: (this.getAttribute("transition") as DigitsTransition | null) ?? undefined,
    };
  }

  #label(): void {
    this.setAttribute("aria-label", this.getAttribute("label") ?? this.#digits?.value ?? "");
  }
}

/** Register <tacet-digits>. Calling again is harmless; in Node it stays quiet. */
export function defineTacetDigits(tag = "tacet-digits"): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(tag)) return;
  customElements.define(tag, TacetDigitsElement);
}
