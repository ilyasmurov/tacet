// Stroke width, optical zoom and cuts — the geometry that does not depend on
// which glyph is being drawn.

import type { Gap } from "./data.js";

/** Stroke width on screen at size 24. The point the whole set was calibrated at. */
export const STROKE_AT_24 = 1.5;

/**
 * How closely stroke follows size. 0 — it never changes, 1 — it grows in
 * proportion with the icon.
 *
 * 0.45 was picked against the glyphs themselves: between 12 and 24px it gives
 * the same weight the icons were drawn with, and on large sizes it keeps the
 * line from turning into a blueprint — 128px comes out at 3.19px instead of the
 * 7.2px a proportional rule would produce.
 */
export const STROKE_EXPONENT = 0.45;

/**
 * The size we fall back to when nonsense arrives. Zero, negatives and NaN are
 * everyday occurrences: `size={containerWidth}` before the first measurement,
 * `size={props.size}` with undefined in the data, a hidden element with zero
 * width. On such input the formula used to put NaN into the attribute, which
 * means an invisible icon.
 */
const FALLBACK_SIZE = 24;

function safeSize(size: number): number {
  return Number.isFinite(size) && size > 0 ? size : FALLBACK_SIZE;
}

export interface StrokeOpts {
  /**
   * Stroke width on screen, in CSS pixels. Once set, size no longer affects it.
   * Note this is the on-screen value, not the `stroke-width` attribute — the
   * attribute is derived from it with the viewBox scale accounted for.
   */
  strokeWidth?: number | undefined;
  /** Stroke stops following size: exactly STROKE_AT_24 at any size. */
  absoluteStroke?: boolean | undefined;
}

/** Stroke width on screen, in CSS pixels. */
export function strokeOnScreen(size: number, opts: StrokeOpts = {}): number {
  if (opts.strokeWidth != null && Number.isFinite(opts.strokeWidth)) return opts.strokeWidth;
  if (opts.absoluteStroke) return STROKE_AT_24;
  return STROKE_AT_24 * Math.pow(safeSize(size) / 24, STROKE_EXPONENT);
}

/** Size with the nonsense cut off — both the viewBox and the stroke follow it. */
export function normalizeSize(size: number): number {
  return safeSize(size);
}

/**
 * Optical zoom. Glyphs in this set occupy about 74% of the 24×24 box — notably
 * less than in most sets — so at the same `size` they would read smaller. We
 * trim the viewBox from every side, but zoom small icons less: at 12px full
 * zoom inflates the glyph and thickens the stroke relative to it.
 *
 * 12px → +8% · 16px → +14% · 20px and up → +18%
 *
 * The outermost glyphs reach 23 units and stick out of the box by roughly one,
 * so the svg needs `overflow: visible` rather than a clip.
 */
export function insetFor(size: number): number {
  if (size <= 12) return 0.9;
  if (size <= 16) return 0.9 + ((size - 12) / 4) * 0.5;
  if (size <= 20) return 1.4 + ((size - 16) / 4) * 0.4;
  return 1.8;
}

/**
 * Cuts as a `stroke-dasharray`. Input is [start%, width%] pairs along the
 * contour length, normalised to 100 through `pathLength`. This is where the
 * defining property of the set comes from: a cut is data rather than something
 * carved into the geometry, so it can be moved or removed without touching the
 * path.
 */
export function dashFor(gaps: Gap[]): string {
  const sorted = [...gaps].sort((a, b) => a[0] - b[0]);
  const out: number[] = [];
  let pos = 0;
  for (const [start, width] of sorted) {
    out.push(Math.max(start - pos, 0.01), width);
    pos = start + width;
  }
  out.push(Math.max(100 - pos, 0.01));
  return out.join(" ");
}
