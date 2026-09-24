// What <tacet-text-field> and <tacet-digits-field> share. The element is the
// field; a real <input> lives inside it, in the light DOM, so it keeps the
// focus, the caret, the selection and its place in a form, and its `input` and
// `change` events bubble out of the element as they are. The input's
// attributes are mirrored from the element's; `value` reads and writes the
// input. The two fields differ only in the controller they mount and in how
// they read `transition`.

import type { IconVariant } from "tacet-core";

/** Attributes handed straight to the inner input. */
const MIRRORED = ["placeholder", "name", "maxlength", "disabled", "readonly", "autocomplete", "inputmode", "required"] as const;

/** What createTextField and createDigitsField give. */
interface Controller<O> {
  refresh(): void;
  update(opts: O): void;
  destroy(): void;
}

/** The options both fields read from their attributes. */
export interface CommonFieldOptions {
  size: number | undefined;
  variant: IconVariant | undefined;
  solid: boolean | undefined;
  strokeWidth: number | undefined;
  absoluteStroke: boolean | undefined;
  accentColor: string | undefined;
}

export abstract class TacetFieldElement<O> extends HTMLElement {
  static observedAttributes = [
    "value", "label", ...MIRRORED,
    "size", "variant", "solid", "stroke-width", "absolute-stroke", "accent-color", "transition",
  ];

  #input: HTMLInputElement | null = null;
  #field: Controller<O> | null = null;

  /** Takes over the element with the controller of this field. */
  protected abstract create(field: HTMLElement, opts: O): Controller<O>;
  /** Every option, present or not: a removed attribute gives the option back. */
  protected abstract options(): O;
  /** What the input gets for a mirrored attribute the element does not have. */
  protected inputDefaults(): Record<string, string> {
    return {};
  }

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
    this.#field = this.create(this, this.options());
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
    else this.#field?.update(this.options());
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

  /** The options both fields share, from the attributes. */
  protected commonOptions(): CommonFieldOptions {
    return {
      size: this.#num("size"),
      variant: (this.getAttribute("variant") as IconVariant | null) ?? undefined,
      solid: this.#bool("solid"),
      strokeWidth: this.#num("stroke-width"),
      absoluteStroke: this.#bool("absolute-stroke"),
      accentColor: this.getAttribute("accent-color") ?? undefined,
    };
  }

  #mirror(name: string): void {
    const value = this.getAttribute(name) ?? this.inputDefaults()[name];
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
}
