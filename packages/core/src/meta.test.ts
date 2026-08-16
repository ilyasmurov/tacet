// Semantics is written by hand and drifts from the set easily: a glyph gets
// renamed while its description still points at the old name. Then an agent is
// advised to take an icon that does not exist.

import { describe, expect, it } from "vitest";
import { META, hasMeta, searchIcons } from "./meta.js";
import { iconNames } from "./renderSpec.js";

const names = iconNames();
const known = new Set<string>(names);

describe("consistency with the set", () => {
  it("descriptions are given only to glyphs that exist", () => {
    for (const name of Object.keys(META)) {
      expect(known.has(name), `no such glyph: ${name}`).toBe(true);
    }
  });

  it("related entries point at glyphs that exist", () => {
    for (const [name, meta] of Object.entries(META)) {
      for (const related of meta.related ?? []) {
        expect(known.has(related), `${name} → ${related}`).toBe(true);
      }
    }
  });

  it("a glyph is not its own relative", () => {
    for (const [name, meta] of Object.entries(META)) {
      expect(meta.related ?? [], name).not.toContain(name);
    }
  });

  it("names inside avoid point at glyphs that exist", () => {
    // Advice to "use `archive`" is useless if no such name exists in the set.
    for (const [name, meta] of Object.entries(META)) {
      for (const match of (meta.avoid ?? "").matchAll(/`([a-z0-9-]+)`/g)) {
        expect(known.has(match[1]!), `${name}: mentions ${match[1]}`).toBe(true);
      }
    }
  });
});

describe("quality of the descriptions", () => {
  it("each has a use and synonyms", () => {
    for (const [name, meta] of Object.entries(META)) {
      // The bar is deliberately low: for an instrument "Harp." says everything,
      // yet an empty string or a placeholder must still be caught. The full stop
      // marks a phrase that was finished rather than abandoned mid-word.
      expect(meta.use.length, name).toBeGreaterThanOrEqual(5);
      expect(meta.use.trim().endsWith("."), `${name}: use is not a phrase`).toBe(true);
      expect(meta.synonyms.length, name).toBeGreaterThan(1);
    }
  });

  it("synonyms are given in both languages", () => {
    for (const [name, meta] of Object.entries(META)) {
      const hasCyrillic = meta.synonyms.some((s) => /[а-яё]/i.test(s));
      const hasLatin = meta.synonyms.some((s) => /[a-z]/i.test(s));
      expect(hasCyrillic, `${name}: no Russian synonyms`).toBe(true);
      expect(hasLatin, `${name}: no English synonyms`).toBe(true);
    }
  });

  it("synonyms do not repeat within a glyph", () => {
    for (const [name, meta] of Object.entries(META)) {
      expect(new Set(meta.synonyms).size, name).toBe(meta.synonyms.length);
    }
  });
});

describe("search", () => {
  it("finds by name", () => {
    expect(searchIcons("bell", names)).toContain("bell");
  });

  it("finds by a Russian synonym", () => {
    expect(searchIcons("удалить", names)).toContain("trash");
    expect(searchIcons("скрыть", names)).toContain("eye-off");
  });

  it("finds by an English synonym absent from the name", () => {
    expect(searchIcons("success", names)).toContain("check-circle");
    expect(searchIcons("spinner", names)).toContain("loading");
  });

  it("an empty query returns everything", () => {
    expect(searchIcons("  ", names).length).toBe(names.length);
  });

  it("nonsense returns empty instead of crashing", () => {
    expect(searchIcons("щщщ", names)).toEqual([]);
  });
});

describe("coverage", () => {
  it("something is described and it is visible how much is left", () => {
    const described = Object.keys(META).length;
    // Not a hard gate but a progress marker: the set is described in batches.
    expect(described).toBeGreaterThan(0);
    console.log(`semantics: ${described} of ${names.length}, ${names.length - described} left`);
  });

  it("the most confused glyphs are described first", () => {
    for (const name of ["trash", "archive", "check", "check-circle", "x", "circle-x", "eye-off"]) {
      expect(hasMeta(name), name).toBe(true);
    }
  });
});
