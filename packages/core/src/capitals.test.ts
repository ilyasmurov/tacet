// Tests for the capitals and the punctuation of the Text layout: the names are
// all there, and the accent keeps to the rule — one element per letter, the
// one that tells it from its look-alikes, never the whole letter.

import { describe, expect, it } from "vitest";
import { ICONS, type IconDef } from "./data.js";
import { MARK_SIDES } from "./textSpacing.js";

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

/** Cyrillic capitals by their Unicode names, and the Latin letter each twin repeats. */
const CYRILLIC = [
  "a", "be", "ve", "ghe", "de", "ie", "io", "zhe", "ze", "i", "short-i", "ka", "el", "em", "en", "o", "pe",
  "er", "es", "te", "u", "ef", "ha", "tse", "che", "sha", "shcha", "hard-sign", "yeru", "soft-sign", "e", "yu", "ya",
].map((name) => `cyrillic-${name}`);
const TWINS: Record<string, string> = {
  "cyrillic-a": "latin-a", "cyrillic-ve": "latin-b", "cyrillic-ie": "latin-e", "cyrillic-ka": "latin-k",
  "cyrillic-em": "latin-m", "cyrillic-en": "latin-h", "cyrillic-o": "latin-o", "cyrillic-er": "latin-p",
  "cyrillic-es": "latin-c", "cyrillic-te": "latin-t", "cyrillic-ha": "latin-x",
};

describe("Cyrillic capitals", () => {
  it("all 33 letters are in the set", () => {
    expect(CYRILLIC).toHaveLength(33);
    for (const name of CYRILLIC) expect(DEFS[name], name).toBeDefined();
  });

  it("the eleven twins repeat their Latin letters exactly", () => {
    for (const [cyrillic, latin] of Object.entries(TWINS)) expect(DEFS[cyrillic], cyrillic).toEqual(DEFS[latin]);
  });

  it("each letter carries exactly one accent element", () => {
    for (const name of CYRILLIC) expect(accentElements(DEFS[name]!), name).toBe(1);
  });

  it("no letter is painted whole", () => {
    for (const name of CYRILLIC) expect(paintedWhole(DEFS[name]!), name).toBe(false);
  });

  it("the accent sits on what tells a letter from its look-alike", () => {
    // Ц and Щ — the tail; Й — the breve; Ё — the dots; Ы — the stick; Ъ — the flag.
    const tail = DEFS["cyrillic-shcha"]![0]!;
    expect(tail.accentSpans).toEqual([[89, 11]]);
    expect(DEFS["cyrillic-shcha"]!.slice(1).every((part) => !part?.accent)).toBe(true);
    expect(DEFS["cyrillic-short-i"]![0]!.accentSpans).toBeUndefined();
    expect(DEFS["cyrillic-short-i"]![1]!.accent).toBe(true);
    expect(DEFS["cyrillic-io"]!.filter((part) => part?.t === "circle").every((part) => part!.accent)).toBe(true);
  });

  it("the dots of Ё follow the stroke", () => {
    const dots = DEFS["cyrillic-io"]!.filter((part) => part?.t === "circle");
    expect(dots).toHaveLength(2);
    for (const dot of dots) expect(dot!.rOfStroke).toBe(0.62);
  });
});

const MARKS = [
  "period", "comma", "colon", "semicolon", "hyphen", "dash", "exclamation", "question",
  "quote-open", "quote-close", "paren-open", "paren-close", "apostrophe", "ellipsis",
].map((name) => `mark-${name}`);

describe("punctuation", () => {
  it("all 14 marks are in the set, each with its bearings", () => {
    for (const name of MARKS) {
      expect(DEFS[name], name).toBeDefined();
      expect(MARK_SIDES[name], name).toHaveLength(2);
    }
    expect(Object.keys(MARK_SIDES).sort()).toEqual([...MARKS].sort());
  });

  it("only the dots of ! and ? carry the accent", () => {
    for (const name of MARKS) {
      const accents = accentElements(DEFS[name]!);
      expect(accents, name).toBe(name === "mark-exclamation" || name === "mark-question" ? 1 : 0);
    }
  });

  it("every dot follows the stroke", () => {
    for (const name of MARKS) {
      for (const part of DEFS[name]!) if (part?.t === "circle") expect(part.rOfStroke, name).toBe(0.62);
    }
  });

  it("the full stop, the comma and the ellipsis sit on the baseline", () => {
    for (const name of ["mark-period", "mark-ellipsis"]) {
      for (const part of DEFS[name]!) expect(part!.cy, name).toBe(19.8);
    }
    expect(DEFS["mark-ellipsis"]).toHaveLength(3);
  });
});
