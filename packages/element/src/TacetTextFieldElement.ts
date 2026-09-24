// <tacet-text-field> — a text field that draws what is typed in the Tacet
// capitals, for projects without React.
//
// The element is the field; a real <input> lives inside it, in the light DOM,
// so it keeps the focus, the caret, the selection and its place in a form, and
// its `input` and `change` events bubble out of the element as they are. The
// input's attributes are mirrored from the element's; `value` reads and writes
// the input.

import {
  createTextField,
  type IconVariant, type TextFieldController, type TextOptions, type TextTransition,
} from "tacet-core";

/** Attributes handed straight to the inner input. */
const MIRRORED = ["placeholder", "name", "maxlength", "disabled", "readonly", "autocomplete", "inputmode", "required"] as const;

export class TacetTextFieldElement extends HTMLElement {
  static observedAttributes = [
    "value", "label", ...MIRRORED,
    "size", "variant", "solid", "stroke-width", "absolute-stroke", "accent-color", "transition",
  ];

  #input: HTMLInputElement | null = null;
  #field: TextFieldController | null = null;

  connectedCallback(): void {
    if (!this.#input) {
      this.#input = this.querySelector("input") ?? document.createElement("input");
      if (!this.#input.isConnected) {
        this.#input.value = this.getAttribute("value") ?? "";
        this.appendChild(this.#input);
      }
    }
    for (const name of MIRRORED) this.#mirror(name);
    this.#label();
    this.#field = createTextField(this, this.#opts());
  }

  disconnectedCallback(): void {
    this.#field?.destroy();
    this.#field = null;
  }

  attributeChangedCallback(name: string): void {
    if (!this.#input) return;
    if (name === "value") {
      this.#input.value = this.getAttribute("value") ?? "";
      this.#field?.refresh();
    } else if (name === "label") this.#label();
    else if ((MIRRORED as readonly string[]).includes(name)) this.#mirror(name);
    else this.#field?.update(this.#opts());
  }

  /** What is typed in the field. */
  get value(): string {
    return this.#input?.value ?? this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    if (!this.#input) {
      this.setAttribute("value", next);
      return;
    }
    this.#input.value = next;
    this.#field?.refresh();
  }

  /** The input inside, for focus and selection from code. */
  get input(): HTMLInputElement | null {
    return this.#input;
  }

  #mirror(name: string): void {
    const value = this.getAttribute(name);
    if (value == null) this.#input!.removeAttribute(name);
    else this.#input!.setAttribute(name, value);
  }

  #label(): void {
    const label = this.getAttribute("label");
    if (label == null) this.#input!.removeAttribute("aria-label");
    else this.#input!.setAttribute("aria-label", label);
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

  /** Every option, present or not: a removed attribute gives the option back. */
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
}

/** Register <tacet-text-field>. Calling again is harmless; in Node it stays quiet. */
export function defineTacetTextField(tag = "tacet-text-field"): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(tag)) return;
  customElements.define(tag, TacetTextFieldElement);
}
