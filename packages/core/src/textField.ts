// A text field that draws what is typed in the Tacet capitals — the field of
// field.ts with the letters of Text.
//
// One character of the input is one glyph of the field, so the replacements are
// one to one: a straight quote becomes a guillemet by where it stands, an
// apostrophe the typographic one, any whitespace a space — and a character the
// set has no glyph for is drawn as an empty box, so it can be seen and stepped
// over. Within a run of glyphs the letters are kerned as in a word of Text, and
// a click lands on the nearest boundary, kerning included.

import { createField, type FieldController, type FieldKind, type FieldMetrics } from "./field.js";
import { strokeOnScreen } from "./stroke.js";
import { glyphForChar } from "./textChars.js";
import { SPACE_ADVANCE, glyphMarkup, layoutGlyph, type TextGlyph } from "./textLayout.js";
import { TEXT_TIMING, eraseOut, fromMarkup, run, writeIn, type TextOptions } from "./text.js";

export { CARET_TIMING } from "./field.js";

export type TextFieldController = FieldController<TextOptions>;

/** Advance of a character the set cannot draw, glyph units: an empty box stands in for it. */
const TOFU_ADVANCE = 9;
/** Key of a character the set cannot draw: two of them are the same drawing. */
const TOFU = "\u0000";

/**
 * What the field draws for each character of the input, one to one: a
 * character Text draws, " " for any whitespace, or null for one it cannot.
 */
export function fieldChars(value: string): (string | null)[] {
  const out: (string | null)[] = [];
  for (let i = 0; i < value.length; i++) {
    const raw = value[i]!;
    if (/\s/.test(raw)) out.push(" ");
    else if (raw === '"') out.push(i === 0 || /[\s(]/.test(value[i - 1]!) ? "«" : "»");
    else if (raw === "'") out.push("’");
    else {
      const up = raw.toUpperCase();
      out.push(up.length === 1 && glyphForChar(up) ? up : null);
    }
  }
  return out;
}

const SVGNS = "http://www.w3.org/2000/svg";

/** The empty box: the height of the capitals, the stroke of the letters, at half strength. */
function tofu(w: number, { size, capTop, capBottom }: FieldMetrics, opts: TextOptions): SVGSVGElement {
  const stroke = strokeOnScreen(size, opts);
  const svg = document.createElementNS(SVGNS, "svg");
  for (const [key, value] of Object.entries({ width: w, height: size, "aria-hidden": "true", class: "tc-tofu" })) svg.setAttribute(key, String(value));
  svg.style.overflow = "visible";
  const rect = document.createElementNS(SVGNS, "rect");
  const inset = w * 0.2;
  for (const [key, value] of Object.entries({
    x: inset, y: capTop, width: w - 2 * inset, height: capBottom - capTop, rx: stroke, fill: "none",
    stroke: "currentColor", "stroke-width": stroke, opacity: 0.45,
  })) rect.setAttribute(key, String(value));
  svg.appendChild(rect);
  return svg;
}

const isTofu = (el: Element) => el.classList.contains("tc-tofu");

const textKind: FieldKind<TextOptions> = {
  clean: (value) => value,

  layout(value, opts, metrics) {
    const chars = fieldChars(value);
    const glyphs: (TextGlyph | null)[] = [];
    const ws: number[] = [];
    let runStart = 0;
    chars.forEach((ch, i) => {
      if (ch === null || ch === " ") {
        glyphs.push(null);
        ws.push((ch === " " ? SPACE_ADVANCE : TOFU_ADVANCE) * metrics.unit);
        runStart = i + 1;
        return;
      }
      // Kerning within a run of glyphs, as in a word of Text.
      let end = i;
      while (end + 1 < chars.length && chars[end + 1] !== null && chars[end + 1] !== " ") end++;
      const glyph = layoutGlyph(chars.slice(runStart, end + 1) as string[], i - runStart, opts);
      glyphs.push(glyph);
      ws.push(Number(glyph.svgAttrs["width"]));
    });
    return {
      keys: chars.map((ch) => ch ?? TOFU),
      ws,
      draw(i) {
        const glyph = glyphs[i];
        if (glyph) return fromMarkup(glyphMarkup(glyph)) as SVGSVGElement;
        return chars[i] === null ? tofu(ws[i]!, metrics, opts) : null;
      },
      refit(el, i) {
        const glyph = glyphs[i];
        if (glyph) for (const key of ["viewBox", "width"] as const) el.setAttribute(key, String(glyph.svgAttrs[key]));
      },
    };
  },

  isBreak: (char) => /\s/.test(char),
  mode: (opts) => (opts.transition === "append" ? "append" : opts.transition === "rewrite" ? "rewrite" : "keep"),
  leaveTime: TEXT_TIMING.erase,
  leave: (flight, el) => (isTofu(el) ? run(flight, el, [{ opacity: 1 }, { opacity: 0 }], TEXT_TIMING.erase, 0, "ease") : eraseOut(flight, el)),
  enter: (flight, el, delay) => (isTofu(el) ? run(flight, el, [{ opacity: 0 }, { opacity: 1 }], TEXT_TIMING.dot, delay, "ease") : writeIn(flight, el, delay)),
  still(el) {
    el.querySelector("mask")?.remove();
    el.querySelector("g.tc-body")?.removeAttribute("mask");
  },
};

/**
 * Takes over `field` — an element with an `<input>` inside — and draws the
 * input's value in the Tacet capitals, with a caret and a selection of its own.
 */
export function createTextField(field: HTMLElement, opts: TextOptions = {}): TextFieldController {
  return createField(field, opts, textKind, "createTextField");
}
