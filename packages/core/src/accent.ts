// Accent on a stretch of a contour.
//
// A cut is a [start%, width%] pair along the contour; so is an accent span. The
// span is painted as a second path of the same geometry over the part, and its
// dash pattern keeps only the span — minus whatever cuts are in effect, or the
// accent would bridge a gap the part itself leaves open.

import type { Gap } from "./data.js";

/** Pieces shorter than this, in percent, are dropped: at icon sizes they read as dust. */
const MIN_PIECE = 0.3;

export interface AccentDash {
  /** `stroke-dasharray`, summing to exactly 100. */
  dash: string;
  /** `stroke-dashoffset`: minus the start of the first visible piece. */
  offset: number;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * The dash that shows only the accent spans, with the cuts taken out.
 *
 * The pattern starts with a visible piece and is shifted into place by the
 * offset. Starting it with a gap would need a zero-length dash first, and a
 * zero-length dash with round caps is drawn as a dot. Returns null when nothing
 * of the accent is left to draw.
 */
export function accentDash(spans: readonly Gap[], cuts: readonly Gap[]): AccentDash | null {
  let pieces: Array<[number, number]> = spans.map(([start, width]) => [clamp(start), clamp(start + width)]);
  for (const [start, width] of cuts) {
    const cutFrom = start;
    const cutTo = start + width;
    const next: Array<[number, number]> = [];
    for (const [from, to] of pieces) {
      if (cutTo <= from || cutFrom >= to) { next.push([from, to]); continue; }
      if (cutFrom > from) next.push([from, cutFrom]);
      if (cutTo < to) next.push([cutTo, to]);
    }
    pieces = next;
  }
  pieces = pieces.filter(([from, to]) => to - from > MIN_PIECE).sort((a, b) => a[0] - b[0]);
  if (!pieces.length) return null;

  const first = pieces[0]![0];
  const out: number[] = [];
  pieces.forEach(([from, to], i) => {
    const nextFrom = i + 1 < pieces.length ? pieces[i + 1]![0] : first + 100;
    out.push(to - from, nextFrom - to);
  });
  // `first ? -first : 0` rather than `-first`: minus zero is a value of its own,
  // and a test comparing with Object.is trips over it.
  return { dash: out.join(" "), offset: first ? -first : 0 };
}
