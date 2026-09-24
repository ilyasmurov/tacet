// Layout of a line of text in the Tacet capitals: which glyphs, how wide each
// one is and what goes inside. Pure data, no DOM — the static markup for
// server rendering and the live controller in text.ts are both built on it.
//
// One svg per character, like the slots of a number: the same optical zoom as
// an Icon of the same size, with the viewBox window narrowed to the glyph's
// advance. Kerning is baked into that window — a glyph is as wide as it is plus
// its pair with the next one — so the markup needs no margins at all. A word
// is a span that does not break and ends with a spacer as wide as a space: the
// line breaks only after that spacer, so a space never starts a line.

import type { IconName } from "./data.js";
import { TEXT_KERNING, TEXT_METRICS } from "./kerning.js";
import { attrString, elementMarkup } from "./markup.js";
import { BODY_CLASS, renderSpec, type ElementSpec, type IconVariant } from "./renderSpec.js";
import { insetFor, normalizeSize, type StrokeOpts } from "./stroke.js";
import { drawingOf, glyphForChar } from "./textChars.js";

/** How a line of text changes into another. */
export type TextTransition = "erase" | "append" | "rewrite";

export interface TextRenderOpts extends StrokeOpts {
  /** Height in pixels — the same `size` an Icon takes. Defaults to 24. */
  size?: number | undefined;
  /** Defaults to D. */
  variant?: IconVariant | undefined;
  /** Solid contour: cuts are not drawn. */
  solid?: boolean | undefined;
  /** What to paint accents with. Defaults to the `--tacet-accent` variable. */
  accentColor?: string | undefined;
}

/** A space, in glyph units: a quarter of the size. */
export const SPACE_ADVANCE = 6.4;
/** Classes of the markup: every glyph svg, every word, every space. */
export const GLYPH_CLASS = "tc-glyph";
export const WORD_CLASS = "tc-word";
export const SPACE_CLASS = "tc-space";

/** Between two digits a colon stands centred, like the one of a number. */
const CLOCK_COLON_Y = [9.4, 15.6] as const;

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * The text as Text draws it: capitals, guillemets for straight quotes, a
 * typographic apostrophe, single spaces. Characters the set has no glyph for
 * are dropped with a warning.
 */
export function normaliseText(value: string | number): string {
  const raw = String(value);
  let out = "";
  let dropped = false;
  for (const ch of raw.replace(/\s+/g, " ").trim()) {
    if (ch === " ") { out += " "; continue; }
    if (ch === '"') { out += !out || /[ (]$/.test(out) ? "«" : "»"; continue; }
    if (ch === "'") { out += "’"; continue; }
    for (const up of ch.toUpperCase()) {
      if (glyphForChar(up)) out += up;
      else dropped = true;
    }
  }
  if (dropped && typeof console !== "undefined") {
    console.warn(`tacet: Text draws capitals, digits and . , : ; - — ! ? « » ( ) ’ …; the rest of "${raw}" is dropped`);
  }
  return out.replace(/ {2,}/g, " ").trim();
}

export interface TextGlyph {
  /** The character, as normalised. */
  char: string;
  /** The glyph that draws it. */
  name: IconName;
  /** Attributes for the glyph's `<svg>`. */
  svgAttrs: Record<string, string | number>;
  /** Shapes for its body group. */
  parts: ElementSpec[];
}

export interface TextLayoutResult {
  /** The normalised text. */
  text: string;
  /** Glyphs word by word. */
  words: TextGlyph[][];
  /** Width of a space, in pixels. */
  space: number;
}

function glyph(chars: string[], i: number, opts: TextRenderOpts): TextGlyph {
  const char = chars[i]!;
  const name = glyphForChar(char)!;
  const size = normalizeSize(opts.size ?? 24);
  const inset = insetFor(size);
  const visible = 24 - 2 * inset;
  const unitsToPx = size / visible;

  const own = drawingOf(char);
  const next = chars[i + 1];
  const [x, width] = TEXT_METRICS[own]!;
  const advance = width + (next ? TEXT_KERNING[own]?.[drawingOf(next)] ?? 0 : 0);

  const spec = renderSpec(name, {
    size,
    variant: opts.variant,
    solid: opts.solid,
    accentColor: opts.accentColor,
    strokeWidth: opts.strokeWidth,
    absoluteStroke: opts.absoluteStroke,
  })!;
  let parts = spec.parts;
  const clock = char === ":" && /\d/.test(chars[i - 1] ?? "") && /\d/.test(next ?? "");
  if (clock) {
    let dot = 0;
    parts = parts.map((el) => (el.tag === "circle" ? { tag: el.tag, attrs: { ...el.attrs, cy: CLOCK_COLON_Y[dot++]! } } : el));
  }
  return {
    char,
    name,
    svgAttrs: {
      viewBox: `${x} ${inset} ${round(advance)} ${visible}`,
      width: round(advance * unitsToPx),
      height: size,
      fill: "none",
      "data-char": char,
    },
    parts,
  };
}

/** Glyphs, widths and spacing of a line of text. */
export function textLayout(value: string | number, opts: TextRenderOpts = {}): TextLayoutResult {
  const size = normalizeSize(opts.size ?? 24);
  const text = normaliseText(value);
  const words = text ? text.split(" ").map((word) => {
    const chars = [...word];
    return chars.map((_, i) => glyph(chars, i, opts));
  }) : [];
  return { text, words, space: round((SPACE_ADVANCE * size) / (24 - 2 * insetFor(size))) };
}

/**
 * Attributes every glyph svg carries besides its spec: hidden from readers, and
 * `slice` so that a glyph keeps its size while the controller collapses or
 * grows its width — at rest the box fits the viewBox and nothing changes.
 */
export const GLYPH_ATTRS = { "aria-hidden": "true", class: GLYPH_CLASS, preserveAspectRatio: "xMidYMid slice" } as const;

/** Inline styles of a word and of a space: a word never breaks, a line breaks between words. */
export const WORD_STYLE = "display:inline-block;white-space:nowrap";
export const spaceStyle = (space: number) => `display:inline-block;width:${space}px`;

/**
 * Static markup of a line, for server rendering: the letters are there before
 * any script runs. The live controller rebuilds exactly this DOM.
 */
export function textMarkup(value: string | number, opts: TextRenderOpts = {}): string {
  const layout = textLayout(value, opts);
  const last = layout.words.length - 1;
  return layout.words
    .map((word, i) => `<span class="${WORD_CLASS}" style="${WORD_STYLE}">${word.map(glyphMarkup).join("")}${i < last ? spaceMarkup(layout.space) : ""}</span>`)
    .join("");
}

/** One glyph svg. */
export const glyphMarkup = (g: TextGlyph) =>
  `<svg ${attrString({ ...g.svgAttrs, ...GLYPH_ATTRS, style: "overflow:visible" })}><g class="${BODY_CLASS}">${g.parts.map(elementMarkup).join("")}</g></svg>`;

/** One space between words. */
export const spaceMarkup = (space: number) => `<span class="${SPACE_CLASS}" style="${spaceStyle(space)}"></span>`;
