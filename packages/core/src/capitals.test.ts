// Tests for the capitals and the punctuation of the Text layout: the names are
// all there, and the accent keeps to the rule — one element per letter, the
// one that tells it from its look-alikes, never the whole letter.

import { describe, expect, it } from "vitest";
import { ICONS, type IconDef } from "./data.js";

const DEFS = ICONS as unknown as Record<string, IconDef>;
const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((ch) => `latin-${ch.toLowerCase()}`);

/** Accent elements of a glyph. The dots of Ё count as one: together they are the diacritic. */
function accentElements(def: IconDef): number {
  let count = 0;
  let dots = false;
  for (const part of def) {
    if (!part) continue;
    if (part.t === "circle" && part.accent) { dots = true; continue; }
    if (part.accent) count++;
    count += part.accentSpans?.length ?? 0;
  }
  return count + (dots ? 1 : 0);
}

/** Whether every stroke of the glyph is painted with the accent from end to end. */
function paintedWhole(def: IconDef): boolean {
  return def.every((part) => !part || part.accent || (part.accentSpans ?? []).some(([s, w]) => s <= 0 && s + w >= 100));
}

describe("Latin capitals", () => {
  it("A to Z are all in the set", () => {
    for (const name of LATIN) expect(DEFS[name], name).toBeDefined();
  });

  it("each letter carries exactly one accent element", () => {
    for (const name of LATIN) expect(accentElements(DEFS[name]!), name).toBe(1);
  });

  it("no letter is painted whole", () => {
    for (const name of LATIN) expect(paintedWhole(DEFS[name]!), name).toBe(false);
  });

  it("letters are drawn with strokes only, inside the box", () => {
    for (const name of LATIN) {
      for (const part of DEFS[name]!) {
        expect(part?.t, name).toBe("path");
        const numbers = (part!.d!.match(/-?\d*\.?\d+/g) ?? []).map(Number);
        for (const n of numbers) expect(n >= 0 && n <= 24, `${name}: ${n}`).toBe(true);
      }
    }
  });
});
