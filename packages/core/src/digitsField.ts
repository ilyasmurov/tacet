// A field for numbers — the field of field.ts with the digits of Digits.
//
// It holds the digits and the colon only: whatever else is typed or pasted is
// taken out of the input at once, and the caret stays among what is left. The
// digits are tabular, so a caret between two of them stands where it stood. A
// digit that gives way to a digit turns into it where it stands, the way
// Digits does it; the rest goes as in the text field — what went erases, the
// tail moves, the new digits draw themselves in. A double click takes the
// group between two colons.

import { DIGIT_TIMING, appear, erase, eraseStrokes, makeSlot, morph, relay, settle, type DigitsOptions, type Slot } from "./digits.js";
import { keepDigits, slotSpec } from "./digitsLayout.js";
import { createField, type FieldController, type FieldKind } from "./field.js";
import { TEXT_TIMING, run } from "./text.js";

export type DigitsFieldController = FieldController<DigitsOptions>;

/** The slot behind each svg the field draws: the field places svgs, the digits engine animates slots. */
const slots = new WeakMap<SVGSVGElement, Slot>();
const slotOf = (el: SVGSVGElement) => slots.get(el)!;

const isColon = (el: SVGSVGElement) => slotOf(el).char === ":";

const digitsKind: FieldKind<DigitsOptions> = {
  clean: keepDigits,

  layout(value, opts) {
    const keys = value.split("");
    return {
      keys,
      ws: keys.map((char) => Number(slotSpec(char, opts).svgAttrs["width"])),
      draw(i) {
        const slot = makeSlot(keys[i]!, opts);
        slots.set(slot.svg, slot);
        return slot.svg;
      },
      refit() {},
    };
  },

  isBreak: (char) => char === ":",
  mode: () => "keep",
  leaveTime: DIGIT_TIMING.vanish,

  // The colon has no contour to draw or erase: its dots fade, like the dots of the letters.
  leave(flight, el, opts) {
    if (isColon(el)) return run(flight, el, [{ opacity: 1 }, { opacity: 0 }], TEXT_TIMING.dot, 0, "ease");
    settle(slotOf(el), opts);
    return eraseStrokes(slotOf(el));
  },
  enter(flight, el, delay) {
    if (isColon(el)) return run(flight, el, [{ opacity: 0 }, { opacity: 1 }], TEXT_TIMING.dot, delay, "ease");
    return appear(slotOf(el), delay);
  },
  turn(_flight, el, from, to, opts) {
    if (from === ":" || to === ":") return null;
    const slot = slotOf(el);
    if (opts.transition === "relay") return relay(slot, to, 0, opts);
    if (opts.transition === "erase") return erase(slot, to, 0, opts);
    return morph(slot, to, 0, opts);
  },
  still: (el, opts) => settle(slotOf(el), opts),
};

/**
 * Takes over `field` — an element with an `<input>` inside — and draws the
 * input's value in the Tacet digits, with a caret and a selection of its own.
 * The input keeps the digits and the colon only.
 */
export function createDigitsField(field: HTMLElement, opts: DigitsOptions = {}): DigitsFieldController {
  return createField(field, opts, digitsKind, "createDigitsField");
}
