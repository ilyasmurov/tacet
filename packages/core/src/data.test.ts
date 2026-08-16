// The set's data is edited by hand, and a malformed entry only shows up on
// screen — so integrity is checked separately from rendering.

import { describe, expect, it } from "vitest";
import { ANIM, ICONS, SOLID_BY_DEFAULT, type IconDef, type Part } from "./data.js";
import { dashFor } from "./stroke.js";

const entries = Object.entries(ICONS as unknown as Record<string, IconDef>);

describe("glyph data", () => {
  it("the set is not empty and names are unique", () => {
    expect(entries.length).toBeGreaterThan(200);
    expect(new Set(Object.keys(ICONS)).size).toBe(entries.length);
  });

  it("names are fit for ids, files and urls", () => {
    for (const [name] of entries) {
      expect(name, name).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("every part has its required fields filled in", () => {
    for (const [name, def] of entries) {
      for (const raw of def) {
        if (!raw) continue;
        const part = raw as Part;
        if (part.t === "path" || part.t === "hole") {
          if (part.t === "hole" && part.d == null) {
            expect(part.cx, name).toBeTypeOf("number");
            continue;
          }
          expect(part.d, name).toBeTypeOf("string");
        } else if (part.t === "circle") {
          for (const key of ["cx", "cy", "r"] as const) expect(part[key], `${name}.${key}`).toBeTypeOf("number");
        } else {
          for (const key of ["x", "y", "w", "h", "rx"] as const) expect(part[key], `${name}.${key}`).toBeTypeOf("number");
        }
      }
    }
  });

  it("cuts stay inside the contour and never overlap", () => {
    for (const [name, def] of entries) {
      for (const raw of def) {
        const gaps = (raw as Part | null)?.gaps;
        if (!gaps?.length) continue;
        const sorted = [...gaps].sort((a, b) => a[0] - b[0]);
        let prevEnd = 0;
        for (const [start, width] of sorted) {
          expect(start, name).toBeGreaterThanOrEqual(0);
          expect(width, name).toBeGreaterThan(0);
          expect(start + width, name).toBeLessThanOrEqual(100);
          expect(start, `${name}: cuts overlap`).toBeGreaterThanOrEqual(prevEnd);
          prevEnd = start + width;
        }
      }
    }
  });

  it("dashFor always covers exactly the contour length", () => {
    for (const [name, def] of entries) {
      for (const raw of def) {
        const gaps = (raw as Part | null)?.gaps;
        if (!gaps?.length) continue;
        const sum = dashFor(gaps).split(" ").reduce((acc, n) => acc + Number(n), 0);
        expect(sum, name).toBeCloseTo(100, 5);
      }
    }
  });
});

describe("companion tables", () => {
  it("animation presets point at glyphs that exist", () => {
    for (const name of Object.keys(ANIM)) {
      expect(Object.prototype.hasOwnProperty.call(ICONS, name), name).toBe(true);
    }
  });

  it("the solid-by-default list points at glyphs that exist", () => {
    for (const name of SOLID_BY_DEFAULT) {
      expect(Object.prototype.hasOwnProperty.call(ICONS, name), name).toBe(true);
    }
  });
});
