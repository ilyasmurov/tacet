// Every glyph through the translation, not a hand-picked few.
//
// The two worst defects of the first version — a group mask burning away the
// clock inside a calendar, and a dropped vector-effect making a violin body six
// times thicker than its neck — both lived in glyphs nobody thought to open.
// Three of 320 have cut-outs, four have transforms.

import { describe, expect, it } from "vitest";
import { ICONS, renderSpec, type IconVariant } from "tacet-core";
import { dashInUnits, partLength } from "./pathLength.js";
import { toNativeAttrs } from "./nativeAttrs.js";

const names = Object.keys(ICONS);
const colors = { color: "#18181b", accentColor: "#2563eb" };

/** The same length the component computes, out of the rendered attributes. */
function lengthOf(part: { tag: string; attrs: Record<string, string | number> }): number | null {
  const a = part.attrs;
  if (part.tag === "circle") return partLength({ t: "circle", r: Number(a["r"]) });
  if (part.tag === "rect") {
    return partLength({ t: "rect", w: Number(a["width"]), h: Number(a["height"]), rx: Number(a["rx"] ?? 0) });
  }
  return partLength({ t: "path", d: String(a["d"] ?? "") });
}

function translate(name: string, variant: IconVariant = "D") {
  const spec = renderSpec(name, { size: 24, variant })!;
  return spec.parts.map((part) => toNativeAttrs(part.attrs, colors, lengthOf(part), dashInUnits));
}

describe("the whole set through the native translation", () => {
  it("has glyphs at all", () => {
    expect(names.length).toBeGreaterThan(300);
  });

  it("leaves no web spelling behind", () => {
    for (const name of names) {
      for (const attrs of translate(name)) {
        for (const key of Object.keys(attrs)) {
          expect(key, `${name}: ${key}`).not.toContain("-");
        }
      }
    }
  });

  it("leaves no pathLength: cuts would be read as units", () => {
    for (const name of names) {
      for (const attrs of translate(name)) {
        expect(attrs["pathLength"], name).toBeUndefined();
      }
    }
  });

  it("leaves no NaN: one is enough for react-native-svg to drop the contour", () => {
    for (const name of names) {
      for (const attrs of translate(name)) {
        for (const [key, value] of Object.entries(attrs)) {
          if (typeof value === "number") expect(Number.isFinite(value), `${name}.${key}`).toBe(true);
          if (Array.isArray(value)) {
            for (const n of value) expect(Number.isFinite(n), `${name}.${key}`).toBe(true);
          }
        }
      }
    }
  });

  it("resolves every colour: there is no cascade on a phone", () => {
    for (const name of names) {
      for (const attrs of translate(name)) {
        for (const key of ["stroke", "fill"]) {
          const value = attrs[key];
          if (typeof value !== "string") continue;
          expect(value, `${name}.${key}`).not.toBe("currentColor");
          expect(value.startsWith("var("), `${name}.${key}`).toBe(false);
        }
      }
    }
  });

  it("keeps the mask on the parts the engine masked, and only on them", () => {
    // The whole reason the group is not masked: in calendar-clock the clock
    // lies inside the cut-out and must survive it.
    const masked = names.filter((name) => translate(name).some((attrs) => attrs["mask"] != null));
    expect(masked.length).toBeGreaterThan(0);

    for (const name of masked) {
      const spec = renderSpec(name, { size: 24 })!;
      const native = translate(name);
      spec.parts.forEach((part, i) => {
        expect(!!native[i]!["mask"], `${name} part ${i}`).toBe(part.attrs["mask"] != null);
      });
    }
  });

  it("keeps non-scaling-stroke on transformed parts, along with its screen width", () => {
    // Drop it and the engine's own compensation turns against the glyph: a
    // violin body comes out six times thicker than its neck at 128px.
    const transformed = names.filter((name) => translate(name).some((attrs) => attrs["vectorEffect"] != null));
    expect(transformed.length).toBeGreaterThan(0);
    for (const name of transformed) {
      for (const attrs of translate(name)) {
        if (attrs["vectorEffect"] == null) continue;
        expect(attrs["vectorEffect"], name).toBe("non-scaling-stroke");
        expect(attrs["transform"], name).toBeDefined();
      }
    }
  });

  it("cuts every contour that has cuts", () => {
    // If the length failed to measure, the part is drawn solid — a whole glyph,
    // but the set stops being itself. On the current data it must not happen.
    for (const name of names) {
      const spec = renderSpec(name, { size: 24 })!;
      const native = translate(name);
      spec.parts.forEach((part, i) => {
        const webDash = part.attrs["stroke-dasharray"];
        if (webDash == null || webDash === "100 0") return;
        expect(native[i]!["strokeDasharray"], `${name} part ${i}`).toBeDefined();
      });
    }
  });

  it("keeps the accent apart from the body in variants C and D", () => {
    const accented = names.filter((name) =>
      translate(name, "D").some((attrs) => attrs["stroke"] === colors.accentColor || attrs["fill"] === colors.accentColor),
    );
    expect(accented.length).toBeGreaterThan(0);
    // In A and B the same glyph is monochrome — the accent is a variant feature.
    for (const name of accented.slice(0, 20)) {
      for (const attrs of translate(name, "A")) {
        expect(attrs["stroke"], name).not.toBe(colors.accentColor);
      }
    }
  });
});
