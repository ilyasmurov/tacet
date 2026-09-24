// kerning.ts is generated from the glyphs; these tests keep it honest: fresh
// against the data, never letting two glyphs touch, and doing the job it is for.

import { describe, expect, it } from "vitest";
import { ICONS, type IconDef } from "./data.js";
import { TEXT_KERNING, TEXT_METRICS } from "./kerning.js";
import { SAME_DRAWING, TEXT_GLYPHS } from "./textChars.js";
import { KERN, measureText, profileOf } from "./textMeasure.js";

const defs = ICONS as unknown as Record<string, IconDef>;
const kern = (a: string, b: string) => TEXT_KERNING[a]?.[b] ?? 0;

/** Closest approach of the inks of a and b as the layout sets them, glyph units. */
function closest(a: string, b: string): number {
  const pa = profileOf(defs[TEXT_GLYPHS[a]!]!), pb = profileOf(defs[TEXT_GLYPHS[b]!]!);
  const [xa, wa] = TEXT_METRICS[a]!, [xb] = TEXT_METRICS[b]!;
  let gap = Infinity;
  for (let i = 0; i < pa.R.length; i++) {
    if (!Number.isFinite(pa.R[i]!) || !Number.isFinite(pb.L[i]!)) continue;
    gap = Math.min(gap, xa + wa - pa.R[i]! + (pb.L[i]! - xb) + kern(a, b));
  }
  return gap;
}

describe("kerning.ts", () => {
  it("is fresh: measuring the glyphs again gives the same numbers", () => {
    const { metrics, kerning } = measureText();
    expect(TEXT_METRICS).toEqual(metrics);
    expect(TEXT_KERNING).toEqual(kerning);
  });

  it("has metrics for every character Text draws, twins through their Latin letter", () => {
    for (const ch of Object.keys(TEXT_GLYPHS)) {
      const own = SAME_DRAWING[ch] ?? ch;
      expect(TEXT_METRICS[own], ch).toBeDefined();
    }
  });

  it("never lets two kerned glyphs come closer than the minimum gap", () => {
    const kerned = Object.keys(TEXT_METRICS).filter((ch) => /^[A-ZА-ЯЁ0-9«»]$/.test(ch));
    for (const a of kerned) {
      for (const b of kerned) expect(closest(a, b), a + b).toBeGreaterThanOrEqual(KERN.minGap - 0.06);
    }
  });

  it("tucks the full stop under the arm of Т and Г", () => {
    expect(kern("T", ".")).toBeLessThan(-1);
    expect(kern("Г", ".")).toBeLessThan(-1);
  });
});
