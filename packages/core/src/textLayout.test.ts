// Tests for the text layout: what the text turns into, how wide each glyph is,
// and the markup the live controller has to reproduce.

import { afterEach, describe, expect, it, vi } from "vitest";
import { ICONS, type IconDef } from "./data.js";
import { TEXT_KERNING, TEXT_METRICS } from "./kerning.js";
import { hasIcon } from "./renderSpec.js";
import { insetFor } from "./stroke.js";
import { TEXT_GLYPHS, glyphForChar } from "./textChars.js";
import { profileOf } from "./textMeasure.js";
import { SPACE_CLASS, WORD_CLASS, normaliseText, textLayout, textMarkup } from "./textLayout.js";

afterEach(() => vi.restoreAllMocks());

describe("normaliseText", () => {
  it("sets the text in capitals", () => {
    expect(normaliseText("Привет, мир!")).toBe("ПРИВЕТ, МИР!");
    expect(normaliseText("don't")).toBe("DON’T");
  });

  it("turns straight quotes into guillemets by where they stand", () => {
    expect(normaliseText('"tacet" means "silent"')).toBe("«TACET» MEANS «SILENT»");
    expect(normaliseText('("a")')).toBe("(«A»)");
  });

  it("keeps the ellipsis as one mark", () => {
    expect(normaliseText("Сохраняю…")).toBe("СОХРАНЯЮ…");
  });

  it("collapses spaces and trims the ends", () => {
    expect(normaliseText("  a \n\t b  ")).toBe("A B");
  });

  it("drops what the set cannot draw, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(normaliseText("a @ b #1")).toBe("A B 1");
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("glyphForChar", () => {
  it("names a glyph that exists for every character Text draws", () => {
    expect(Object.keys(TEXT_GLYPHS)).toHaveLength(26 + 33 + 10 + 14);
    for (const [ch, name] of Object.entries(TEXT_GLYPHS)) expect(hasIcon(name), ch).toBe(true);
  });

  it("knows nothing about the rest", () => {
    expect(glyphForChar("@")).toBeNull();
    expect(glyphForChar("a")).toBeNull();
    expect(glyphForChar("toString")).toBeNull();
  });
});

describe("textLayout", () => {
  const unitsToPx = (size: number) => size / (24 - 2 * insetFor(size));

  it("splits the text into words", () => {
    const layout = textLayout("Привет, мир", { size: 32 });
    expect(layout.words.map((w) => w.map((g) => g.char).join(""))).toEqual(["ПРИВЕТ,", "МИР"]);
    expect(layout.space).toBeCloseTo(6.4 * unitsToPx(32), 1);
  });

  it("bakes the kerning pair into the width of the first glyph", () => {
    const [[t, a]] = textLayout("TA", { size: 24 }).words as [[{ svgAttrs: Record<string, string | number> }, unknown]];
    const expected = TEXT_METRICS["T"]![1] + (TEXT_KERNING["T"]?.["A"] ?? 0);
    expect(String(t.svgAttrs["viewBox"]).split(" ")[2]).toBe(String(Math.round(expected * 100) / 100));
    expect(Number(t.svgAttrs["width"])).toBeCloseTo(expected * unitsToPx(24), 1);
    expect(a).toBeDefined();
  });

  it("gives the Cyrillic twins the metrics of their Latin letters", () => {
    const [latin] = textLayout("A").words;
    const [cyrillic] = textLayout("А").words;
    expect(cyrillic![0]!.svgAttrs["viewBox"]).toBe(latin![0]!.svgAttrs["viewBox"]);
    expect(cyrillic![0]!.name).toBe("cyrillic-a");
  });

  it("centres a colon between two digits, and only there", () => {
    const cy = (text: string) =>
      textLayout(text).words[0]!.find((g) => g.char === ":")!.parts.filter((p) => p.tag === "circle").map((p) => p.attrs["cy"]);
    expect(cy("10:30")).toEqual([9.4, 15.6]);
    expect(cy("A:B")).toEqual([10.8, 19.8]);
    expect(cy("1:A")).toEqual([10.8, 19.8]);
  });

  it("sets ТА tighter than НН", () => {
    const defs = ICONS as unknown as Record<string, IconDef>;
    /** White between the inks of a pair: bearings plus kerning. */
    const air = (a: string, b: string) => {
      const [xa, wa] = TEXT_METRICS[a]!, [xb] = TEXT_METRICS[b]!;
      const pa = profileOf(defs[TEXT_GLYPHS[a]!]!), pb = profileOf(defs[TEXT_GLYPHS[b]!]!);
      return xa + wa - pa.maxX + (pb.minX - xb) + (TEXT_KERNING[a]?.[b] ?? 0);
    };
    expect(air("T", "A")).toBeLessThan(air("H", "H"));
  });
});

describe("textMarkup", () => {
  it("renders words, spaces and one hidden svg per glyph", () => {
    document.body.innerHTML = `<div>${textMarkup("Как дела?", { size: 24 })}</div>`;
    const words = document.querySelectorAll(`.${WORD_CLASS}`);
    expect(words).toHaveLength(2);
    // The space closes the first word: a line never starts with it.
    expect(words[0]!.lastElementChild!.classList.contains(SPACE_CLASS)).toBe(true);
    expect(document.querySelectorAll(`.${SPACE_CLASS}`)).toHaveLength(1);
    const svgs = document.querySelectorAll("svg");
    expect(svgs).toHaveLength(8);
    for (const svg of svgs) expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect([...svgs].map((svg) => svg.getAttribute("data-char")).join("")).toBe("КАКДЕЛА?");
  });

  it("is empty for an empty text", () => {
    expect(textMarkup("   ")).toBe("");
  });
});
