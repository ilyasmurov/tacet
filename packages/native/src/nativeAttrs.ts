// Attributes from the engine, in the spelling react-native-svg understands.
//
// Two differences from the web, and neither is cosmetic.
//
// `pathLength` does not exist in react-native-svg: cuts given as percentages
// would be read as units and the contour would fall apart. They are converted
// beforehand (see pathLength.ts) and the attribute is dropped.
//
// `currentColor` does not exist either — there is no cascade to inherit from.
// The engine writes it wherever the glyph should take the surrounding colour,
// so the colour is substituted here, as is the accent variable. The same goes
// for `oklch()`, which a glyph with a colour of its own is written in: React
// Native's parser returns null for it and the part is drawn with nothing.
//
// Everything else goes through, `vector-effect` included: react-native-svg does
// support non-scaling-stroke on both platforms, and the engine relies on it —
// for a transformed part it writes the width in screen pixels, expecting the
// viewport to measure it. Drop the attribute and a violin body comes out six
// times thicker than its own neck at 128px.

import { toReactAttrName } from "tacet-core";

import { resolveOklch } from "./oklch.js";

/** Attributes the engine emits for the web and a phone has no use for. */
const SKIP = new Set(["pathLength", "data-dash", "data-icon", "data-mk"]);

export interface NativeColors {
  /** What `currentColor` becomes. */
  color: string;
  /** What accent details become. */
  accentColor: string;
}

/** Colour value with web-only spellings resolved. */
function paint(value: string, colors: NativeColors): string {
  if (value === "currentColor") return colors.color;
  // The accent arrives as a CSS variable with a fallback: var(--tacet-accent, currentColor).
  if (value.startsWith("var(")) return colors.accentColor;
  // A glyph that carries its own colour writes it in oklch — see oklch.ts for
  // why that has to be resolved here rather than passed through.
  return resolveOklch(value);
}

export function toNativeAttrs(
  attrs: Record<string, string | number>,
  colors: NativeColors,
  /** Contour length; without it cuts are dropped and the part is drawn solid. */
  length: number | null,
  dashInUnits: (dash: string, length: number) => number[] | null,
): Record<string, string | number | number[]> {
  const out: Record<string, string | number | number[]> = {};

  for (const key of Object.keys(attrs)) {
    if (SKIP.has(key) || key.startsWith("data-")) continue;
    const value = attrs[key]!;
    const name = toReactAttrName(key);

    if ((name === "stroke" || name === "fill") && typeof value === "string") {
      out[name] = paint(value, colors);
      continue;
    }

    if (name === "strokeDashoffset") {
      // The shift of an accent span is in the same percent as its pattern and
      // needs the same conversion, or the coloured stretch lands off its place.
      if (length == null) continue;
      const shift = (Number(value) * length) / 100;
      if (Number.isFinite(shift)) out[name] = shift;
      continue;
    }

    if (name === "strokeDasharray") {
      // No length — no cuts. A solid glyph is a whole glyph; percentages taken
      // for units would leave a dotted mess.
      if (length == null) continue;
      const dash = dashInUnits(String(value), length);
      if (dash) out[name] = dash;
      continue;
    }

    out[name] = value;
  }

  return out;
}
