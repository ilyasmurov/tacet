// <tacet-text-field> — a text field that draws what is typed in the Tacet
// capitals, for projects without React. The input inside, its attributes and
// `value` are the ones every field shares (TacetFieldElement.ts).

import { createTextField, type TextFieldController, type TextOptions, type TextTransition } from "tacet-core";
import { TacetFieldElement } from "./TacetFieldElement.js";

export class TacetTextFieldElement extends TacetFieldElement<TextOptions> {
  protected create(field: HTMLElement, opts: TextOptions): TextFieldController {
    return createTextField(field, opts);
  }

  protected options(): TextOptions {
    return { ...this.commonOptions(), transition: (this.getAttribute("transition") as TextTransition | null) ?? undefined };
  }
}

/** Register <tacet-text-field>. Calling again is harmless; in Node it stays quiet. */
export function defineTacetTextField(tag = "tacet-text-field"): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(tag)) return;
  customElements.define(tag, TacetTextFieldElement);
}
