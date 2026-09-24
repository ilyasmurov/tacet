// <tacet-text> — a line of text in the Tacet capitals, for projects without React.
//
// The element itself is the host: its children are the words the controller
// from tacet-core drives. A new `value` animates; any other attribute redraws
// the text at once.

import {
  createText,
  type IconVariant, type TextController, type TextOptions, type TextTransition,
} from "tacet-core";

export class TacetTextElement extends HTMLElement {
  static observedAttributes = [
    "value", "size", "variant", "solid", "stroke-width", "absolute-stroke", "accent-color", "transition", "label",
  ];

  #text: TextController | null = null;

  connectedCallback(): void {
    // Lines stack at the height of the glyphs; a stylesheet can still override both.
    if (!this.style.display) this.style.display = "inline-block";
    if (!this.style.lineHeight) this.style.lineHeight = "0";
    this.setAttribute("role", "img");
    this.#text = createText(this, this.getAttribute("value") ?? "", this.#opts());
    this.#label();
  }

  disconnectedCallback(): void {
    this.#text?.destroy();
    this.#text = null;
  }

  attributeChangedCallback(name: string): void {
    if (!this.#text) return;
    if (name === "value") this.#text.set(this.getAttribute("value") ?? "");
    else if (name !== "label") this.#text.update(this.#opts());
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
  #opts(): TextOptions {
    return {
      size: this.#num("size"),
      variant: (this.getAttribute("variant") as IconVariant | null) ?? undefined,
      solid: this.#bool("solid"),
      strokeWidth: this.#num("stroke-width"),
      absoluteStroke: this.#bool("absolute-stroke"),
      accentColor: this.getAttribute("accent-color") ?? undefined,
      transition: (this.getAttribute("transition") as TextTransition | null) ?? undefined,
    };
  }

  /** The label is the text as given, in its own case: capitals make a reader spell it out. */
  #label(): void {
    this.setAttribute("aria-label", this.getAttribute("label") ?? this.getAttribute("value") ?? "");
  }
}

/** Register <tacet-text>. Calling again is harmless; in Node it stays quiet. */
export function defineTacetText(tag = "tacet-text"): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(tag)) return;
  customElements.define(tag, TacetTextElement);
}
