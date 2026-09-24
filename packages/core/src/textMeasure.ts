// Measuring the Text glyphs: ink extents, side bearings and kerning, from the
// glyph data alone — no DOM, so a build script and a test can both run it.
//
// scripts/build-kerning.ts writes the result into kerning.ts; the layout reads
// that file and never measures anything at run time. kerning.test.ts measures
// again and checks the file is not stale.
//
// Kerning, in short. Every glyph gets its left and right ink profile in thin
// horizontal bands. The open side of a glyph — under the arm of Т, between the
// bars of Е — counts only as deep as light gets in: a band sits no further than
// DEPTH from the glyph's extreme and no further than SLOPE × its height from the
// nearest ink that reaches out. A pair moves by FACTOR of the difference
// between its mean gap over the cap height and that of two straight stems
// (Н Н), never closer than MIN_GAP where both glyphs have ink. The steady part
// of that shift goes into each glyph's own bearings; only what is left over
// becomes a kerning pair.

import { ICONS, type IconDef, type Part } from "./data.js";
import { insetFor, strokeOnScreen } from "./stroke.js";
import { DEFAULT_SIDE, MARK_SIDES } from "./textSpacing.js";
import { SAME_DRAWING, TEXT_GLYPHS } from "./textChars.js";

const BAND = 0.25;
const BANDS = 96;
const CAP_FROM = Math.round(4 / BAND);
const CAP_TO = Math.round(20 / BAND);
/** Stroke width in glyph units at size 24 — the size the set was drawn for. */
const STROKE = (strokeOnScreen(24) * (24 - 2 * insetFor(24))) / 24;
const HALF = STROKE / 2;

export const KERN = {
  factor: 0.45,
  depth: 3,
  slope: 0.7,
  /** The gap between two straight stems, Н Н: the spacing every pair is measured against. */
  stems: 2 * DEFAULT_SIDE,
  minGap: 1.8,
  maxPull: 3,
  /** Shifts below this are not worth a pair. */
  threshold: 0.25,
  /** What is left after the bearings took their share, below this, is dropped. */
  residual: 0.3,
} as const;

/** Characters that kern by their outlines: letters, digits, guillemets. */
const KERNED = /^[A-ZА-ЯЁ0-9«»]$/;
/** Marks on the baseline that tuck under an arm: Т. Г, Р… */
const LOW = [".", ",", "…"];

interface Profile {
  L: Float64Array;
  R: Float64Array;
  minX: number;
  maxX: number;
}

/** Points along an absolute M/L/H/V/C path, no further apart than `step`. */
export function flatten(d: string, step = 0.05): [number, number][] {
  const tokens = d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const out: [number, number][] = [];
  let i = 0;
  let x = 0, y = 0, sx = 0, sy = 0;
  let cmd = "";
  const num = () => Number(tokens[i++]);
  const line = (tx: number, ty: number) => {
    const n = Math.max(1, Math.ceil(Math.hypot(tx - x, ty - y) / step));
    for (let k = 1; k <= n; k++) out.push([x + ((tx - x) * k) / n, y + ((ty - y) * k) / n]);
    x = tx; y = ty;
  };
  while (i < tokens.length) {
    if (/^[A-Z]$/i.test(tokens[i]!)) cmd = tokens[i++]!;
    if (cmd !== cmd.toUpperCase()) throw new Error(`textMeasure: relative commands are not supported: ${d}`);
    if (cmd === "M") { x = num(); y = num(); sx = x; sy = y; out.push([x, y]); cmd = "L"; continue; }
    if (cmd === "L") { line(num(), num()); continue; }
    if (cmd === "H") { line(num(), y); continue; }
    if (cmd === "V") { line(x, num()); continue; }
    if (cmd === "Z") { line(sx, sy); continue; }
    if (cmd === "C") {
      const [x1, y1, x2, y2, x3, y3] = [num(), num(), num(), num(), num(), num()];
      const at = (t: number): [number, number] => {
        const u = 1 - t;
        return [
          u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        ];
      };
      let length = 0;
      let prev: [number, number] = [x, y];
      for (let k = 1; k <= 32; k++) { const p = at(k / 32); length += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; }
      const n = Math.max(1, Math.ceil(length / step));
      for (let k = 1; k <= n; k++) out.push(at(k / n));
      x = x3; y = y3;
      continue;
    }
    throw new Error(`textMeasure: unexpected "${cmd}" in ${d}`);
  }
  return out;
}

/** Ink profile of a glyph: leftmost and rightmost ink in each band, stroke width included. */
export function profileOf(def: IconDef): Profile {
  const L = new Float64Array(BANDS + 1).fill(Infinity);
  const R = new Float64Array(BANDS + 1).fill(-Infinity);
  const mark = (x: number, y: number, r: number) => {
    const from = Math.max(0, Math.ceil((y - r) / BAND));
    const to = Math.min(BANDS, Math.floor((y + r) / BAND));
    for (let b = from; b <= to; b++) {
      const dy = b * BAND - y;
      const dx = Math.sqrt(Math.max(0, r * r - dy * dy));
      if (x - dx < L[b]!) L[b] = x - dx;
      if (x + dx > R[b]!) R[b] = x + dx;
    }
  };
  for (const part of def as (Part | null)[]) {
    if (!part) continue;
    if (part.t === "circle") mark(part.cx!, part.cy!, part.rOfStroke != null ? STROKE * part.rOfStroke : part.r!);
    else if (part.d) for (const [x, y] of flatten(part.d)) mark(x, y, HALF);
  }
  let minX = Infinity, maxX = -Infinity;
  for (let b = 0; b <= BANDS; b++) { minX = Math.min(minX, L[b]!); maxX = Math.max(maxX, R[b]!); }
  return { L, R, minX, maxX };
}

/** How deep the open side of a glyph reads, band by band. */
function softDepth(profile: Profile, side: "L" | "R"): Float64Array {
  const raw = Array.from(side === "L" ? profile.L : profile.R, (x) =>
    Number.isFinite(x) ? (side === "L" ? x - profile.minX : profile.maxX - x) : Infinity);
  const out = new Float64Array(BANDS + 1);
  for (let i = 0; i <= BANDS; i++) {
    let best: number = KERN.depth;
    for (let j = 0; j <= BANDS; j++) {
      if (Number.isFinite(raw[j]!)) best = Math.min(best, raw[j]! + Math.abs(i - j) * BAND * KERN.slope);
    }
    out[i] = best;
  }
  return out;
}

export interface Glyph {
  profile: Profile;
  left: number;
  right: number;
  depthL: Float64Array;
  depthR: Float64Array;
}

/** Gap between the inks of two glyphs set side by side with their bearings, band by band. */
export function minGap(a: Glyph, b: Glyph, from = 0): number {
  let gap = Infinity;
  for (let i = from; i <= BANDS; i++) {
    const ra = a.profile.R[i]!, lb = b.profile.L[i]!;
    if (Number.isFinite(ra) && Number.isFinite(lb)) {
      gap = Math.min(gap, a.right + (a.profile.maxX - ra) + b.left + (lb - b.profile.minX));
    }
  }
  return gap;
}

/** The shift the outlines ask for between two kerned glyphs, before bearings take their share. */
function optical(a: Glyph, b: Glyph): number {
  let mean = 0;
  for (let i = CAP_FROM; i <= CAP_TO; i++) mean += a.right + b.left + a.depthR[i]! + b.depthL[i]!;
  mean /= CAP_TO - CAP_FROM + 1;
  let k = Math.max(KERN.factor * (KERN.stems - mean), -KERN.maxPull);
  const gap = minGap(a, b);
  if (Number.isFinite(gap)) k = Math.max(k, Math.min(0, KERN.minGap - gap));
  return Math.abs(k) < KERN.threshold ? 0 : k;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((p, q) => p - q);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const r1 = (n: number) => Math.round(n * 10) / 10;

export interface TextMeasure {
  /** [viewBox x, advance] per character, in glyph units. */
  metrics: Record<string, [number, number]>;
  /** Extra shift of the second character after the first, glyph units; negative pulls it closer. */
  kerning: Record<string, Record<string, number>>;
}

/** Measures every character the Text layout draws. Cyrillic twins are left to SAME_DRAWING. */
export function measureText(): TextMeasure {
  const defs = ICONS as unknown as Record<string, IconDef>;
  const chars = Object.keys(TEXT_GLYPHS).filter((ch) => !(ch in SAME_DRAWING));
  const glyphs: Record<string, Glyph> = {};
  for (const ch of chars) {
    const name = TEXT_GLYPHS[ch]!;
    const profile = profileOf(defs[name]!);
    const [left, right] = MARK_SIDES[name] ?? [DEFAULT_SIDE, DEFAULT_SIDE];
    glyphs[ch] = { profile, left, right, depthL: softDepth(profile, "L"), depthR: softDepth(profile, "R") };
  }

  // The steady part of the kerning goes into the bearings: a median polish of
  // the pair table leaves each kerned glyph a correction on each side.
  const kerned = chars.filter((ch) => KERNED.test(ch));
  const pair: Record<string, number> = {};
  for (const a of kerned) for (const b of kerned) pair[a + b] = optical(glyphs[a]!, glyphs[b]!);
  const right: Record<string, number> = Object.fromEntries(kerned.map((ch) => [ch, 0]));
  const left: Record<string, number> = Object.fromEntries(kerned.map((ch) => [ch, 0]));
  for (let round = 0; round < 8; round++) {
    for (const a of kerned) right[a] = median(kerned.map((b) => pair[a + b]! - left[b]!));
    for (const b of kerned) left[b] = median(kerned.map((a) => pair[a + b]! - right[a]!));
  }
  for (const ch of kerned) {
    glyphs[ch]!.left = r2(glyphs[ch]!.left + left[ch]!);
    glyphs[ch]!.right = r2(glyphs[ch]!.right + right[ch]!);
  }

  // What the bearings could not absorb stays a pair — and so does whatever a
  // pair needs to keep MIN_GAP now that the bearings moved.
  const kerning: Record<string, Record<string, number>> = {};
  const put = (a: string, b: string, k: number) => { (kerning[a] ??= {})[b] = k; };
  for (const a of kerned) {
    for (const b of kerned) {
      let k = pair[a + b]! - right[a]! - left[b]!;
      if (Math.abs(k) < KERN.residual) k = 0;
      const gap = minGap(glyphs[a]!, glyphs[b]!) + k;
      if (gap < KERN.minGap) k += KERN.minGap - gap;
      if (r1(k) !== 0) put(a, b, r1(k));
    }
  }

  // A full stop, a comma or an ellipsis after a letter or a digit sits at the
  // gap it has after Н: under the arm of Т or Г, clear of the foot of А.
  const bottom = Math.round(17.5 / BAND);
  for (const mark of LOW) {
    const reference = minGap(glyphs["H"]!, glyphs[mark]!, bottom);
    for (const a of kerned.filter((ch) => ch !== "«" && ch !== "»")) {
      const now = minGap(glyphs[a]!, glyphs[mark]!, bottom);
      if (!Number.isFinite(now)) continue;
      const k = r1(Math.max(-KERN.maxPull, Math.min(1, reference - now)));
      if (k !== 0) put(a, mark, k);
    }
  }

  const metrics: Record<string, [number, number]> = {};
  for (const ch of chars) {
    const g = glyphs[ch]!;
    metrics[ch] = [r2(g.profile.minX - g.left), r2(g.profile.maxX - g.profile.minX + g.left + g.right)];
  }
  return { metrics, kerning };
}
