// Cuts in real units instead of percentages.
//
// The set describes cuts as shares of the contour length: `pathLength={100}`
// lets the browser take `stroke-dasharray` in percent and the same numbers work
// on any geometry. react-native-svg has no `pathLength` at all, so on a phone
// the shares have to be turned into units by hand — which means knowing how long
// the contour actually is.
//
// A circle and a rectangle are measured by formula. An arbitrary path is
// measured by svg-path-properties: pure JS, no native part, the same numbers on
// iOS and Android.

import { svgPathProperties } from "svg-path-properties";
import type { Part } from "tacet-core";

// Icons repeat by the dozen on a screen, and the geometry of a glyph never
// changes — measuring the same path over and over is pointless.
const lengths = new Map<string, number | null>();

/** Perimeter of a rounded rectangle: straight runs plus four arcs. */
function roundedRectLength(w: number, h: number, rx: number): number {
  const r = Math.min(rx, w / 2, h / 2);
  return 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
}

/** Length of a part's contour, or null when there is nothing to measure. */
export function partLength(part: Part): number | null {
  if (part.t === "circle" && part.r != null) return 2 * Math.PI * part.r;
  if (part.t === "rect" && part.w != null && part.h != null) {
    return roundedRectLength(part.w, part.h, part.rx ?? 0);
  }
  if (part.t !== "path" || !part.d) return null;

  // Failures are cached too: a path the measurer cannot read will not become
  // readable on the next frame, and retrying costs an exception per render.
  if (lengths.has(part.d)) return lengths.get(part.d)!;
  try {
    const measured = new svgPathProperties(part.d).getTotalLength();
    const length = Number.isFinite(measured) && measured > 0 ? measured : null;
    lengths.set(part.d, length);
    return length;
  } catch {
    // A path the measurer cannot read is not a reason to lose the icon: it will
    // be drawn solid, without cuts.
    lengths.set(part.d, null);
    return null;
  }
}

/**
 * `stroke-dasharray` from percentages into units.
 *
 * The engine writes the dash as shares of 100. Multiply each by a hundredth of
 * the real length and the cuts land exactly where the set put them.
 */
export function dashInUnits(dash: string, length: number): number[] | null {
  const out = dash
    .trim()
    .split(/[\s,]+/)
    // Empty pieces are dropped before parsing: Number("") is zero, and a zero
    // segment would pass the check below as a perfectly finite number.
    .filter((piece) => piece.length > 0)
    .map((piece) => (Number(piece) * length) / 100);
  // One unreadable number and the whole dash is off: dropping it would shift
  // every following value into somebody else's role — a gap would become a
  // stroke. Better a solid contour than cuts in the wrong places.
  return out.length > 0 && out.every((n) => Number.isFinite(n)) ? out : null;
}
