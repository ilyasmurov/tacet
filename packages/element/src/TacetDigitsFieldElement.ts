// <tacet-digits-field> — a field for numbers, drawn in the Tacet digits, for
// projects without React: <tacet-text-field>'s twin (TacetFieldElement.ts).
// The input keeps the digits and the colon only, whatever is typed or pasted.

import { createDigitsField, type DigitsFieldController, type DigitsOptions, type DigitsTransition } from "tacet-core";
import { TacetFieldElement } from "./TacetFieldElement.js";

export class TacetDigitsFieldElement extends TacetFieldElement<DigitsOptions> {
  protected create(field: HTMLElement, opts: DigitsOptions): DigitsFieldController {
    return createDigitsField(field, opts);
  }

  protected options(): DigitsOptions {
    return { ...this.commonOptions(), transition: (this.getAttribute("transition") as DigitsTransition | null) ?? undefined };
  }
}

/** Register <tacet-digits-field>. Calling again is harmless; in Node it stays quiet. */
export function defineTacetDigitsField(tag = "tacet-digits-field"): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(tag)) return;
  customElements.define(tag, TacetDigitsFieldElement);
}
