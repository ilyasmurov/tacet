// Layout of a number: which slots it is made of, how wide each one is and what
// goes inside. Pure data, no DOM — the static markup for server rendering and
// the live controller in digits.ts are both built on it, so they cannot drift.

import { ICONS, type Gap, type IconDef } from "./data.js";
import { attrString, elementMarkup } from "./markup.js";
import { BODY_CLASS, renderSpec, type ElementSpec, type IconVariant } from "./renderSpec.js";
import { insetFor, normalizeSize, strokeOnScreen, type StrokeOpts } from "./stroke.js";

/** How one digit turns into another. */
export type DigitsTransition = "morph" | "relay" | "erase";

export interface DigitsRenderOpts extends StrokeOpts {
  /** Height in pixels — the same `size` an Icon takes. Defaults to 24. */
  size?: number | undefined;
  /** Defaults to D. */
  variant?: IconVariant | undefined;
  /** Solid contour: cuts are not drawn. */
  solid?: boolean | undefined;
  /** What to paint accent spans with. Defaults to the `--tacet-accent` variable. */
  accentColor?: string | undefined;
}

/** Class of every slot svg, digits and the colon alike. */
export const SLOT_CLASS = "tc-slot";

/**
 * Width of a digit slot in glyph units. The figures sit in x 7…17 of the 24-unit
 * box; 14 units keeps two of air on each side and gives a tabular number — a 1
 * takes as much room as an 8, so a counter does not jiggle as it ticks.
 */
export const DIGIT_ADVANCE = 14;
/** Width of the colon slot in glyph units. */
export const COLON_ADVANCE = 6;

const DIGIT_X = 12 - DIGIT_ADVANCE / 2;
const COLON_X = 12 - COLON_ADVANCE / 2;
/** Colon dots: centre heights in glyph units, radius as a share of the stroke. */
const COLON_Y = [9.4, 15.6] as const;
const COLON_DOT = 0.62;

const round = (n: number) => Math.round(n * 100) / 100;

/** The characters a number can show. Anything else is dropped with a warning. */
export function parseDigits(value: string | number): string {
  const raw = String(value);
  const kept = raw.replace(/[^0-9:]/g, "");
  if (kept.length !== raw.length && typeof console !== "undefined") {
    console.warn(`tacet: a number shows 0–9 and ":" only, the rest of "${raw}" is dropped`);
  }
  return kept;
}

export interface SlotSpec {
  /** "0"…"9" or ":". */
  char: string;
  /** Attributes for the slot's `<svg>`. */
  svgAttrs: Record<string, string | number>;
  /** Shapes for the slot's body group. */
  parts: ElementSpec[];
}

/**
 * One slot of a number.
 *
 * Vertically it takes the same optical zoom as an Icon of the same size, so a
 * digit inside a number matches `<Icon name="digit-7">` next to it stroke for
 * stroke. Horizontally the window is narrowed to the advance: the viewBox and
 * the width shrink together, so the scale stays the one the stroke was
 * computed for.
 */
export function slotSpec(char: string, opts: DigitsRenderOpts = {}): SlotSpec {
  const size = normalizeSize(opts.size ?? 24);
  const inset = insetFor(size);
  const visible = 24 - 2 * inset;
  const unitsToPx = size / visible;

  if (char === ":") {
    // The same width a stroke would get, turned back into glyph units.
    const stroke = strokeOnScreen(size, opts) / unitsToPx;
    return {
      char,
      svgAttrs: {
        viewBox: `${COLON_X} ${inset} ${COLON_ADVANCE} ${visible}`,
        width: round(COLON_ADVANCE * unitsToPx),
        height: size,
        fill: "none",
        "data-char": char,
      },
      parts: COLON_Y.map((cy) => ({
        tag: "circle" as const,
        attrs: { cx: 12, cy, r: Math.round(stroke * COLON_DOT * 1000) / 1000, fill: "currentColor" },
      })),
    };
  }

  const spec = renderSpec(`digit-${char}`, {
    size,
    variant: opts.variant,
    solid: opts.solid,
    accentColor: opts.accentColor,
    strokeWidth: opts.strokeWidth,
    absoluteStroke: opts.absoluteStroke,
  });
  if (!spec) throw new Error(`tacet: no glyph for the digit "${char}"`);
  return {
    char,
    svgAttrs: {
      viewBox: `${DIGIT_X} ${inset} ${DIGIT_ADVANCE} ${visible}`,
      width: round(DIGIT_ADVANCE * unitsToPx),
      height: size,
      fill: "none",
      "data-char": char,
    },
    parts: spec.parts,
  };
}

export interface DigitGeometry {
  /** The contour. */
  d: string;
  /** Cuts in effect for these options. */
  cuts: Gap[];
  /** Accent spans shown for these options, or null when the variant has none. */
  spans: Gap[] | null;
}

/** Contour, cuts and accent of a digit under the given options — what a morph interpolates. */
export function digitGeometry(char: string, opts: DigitsRenderOpts = {}): DigitGeometry {
  const part = (ICONS as unknown as Record<string, IconDef>)[`digit-${char}`]?.[0];
  if (!part || !part.d) throw new Error(`tacet: no glyph for the digit "${char}"`);
  const variant = opts.variant ?? "D";
  const gaps = part.gaps ?? [];
  const cuts = opts.solid ? [] : variant === "B" || variant === "D" ? [...gaps] : gaps.slice(0, 1);
  const spans = (variant === "C" || variant === "D") && part.accentSpans?.length ? [...part.accentSpans] : null;
  return { d: part.d, cuts, spans };
}

/** Attributes every slot svg carries besides its spec: hidden from readers, unclipped. */
export const SLOT_ATTRS = { "aria-hidden": "true", class: SLOT_CLASS } as const;

/**
 * Static markup of a whole number, for server rendering: the digits are there
 * before any script runs. The live controller rebuilds exactly this DOM.
 */
export function digitsMarkup(value: string | number, opts: DigitsRenderOpts = {}): string {
  return parseDigits(value)
    .split("")
    .map((char) => {
      const slot = slotSpec(char, opts);
      const body = slot.parts.map(elementMarkup).join("");
      const svg = attrString({ ...slot.svgAttrs, ...SLOT_ATTRS, style: "overflow:visible" });
      return `<svg ${svg}><g class="${BODY_CLASS}">${body}</g></svg>`;
    })
    .join("");
}
