import { describe, expect, it } from "vitest";
import { ICONS, type IconDef } from "./data.js";
import { renderSpec, hasIcon, iconNames } from "./renderSpec.js";
import { strokeOnScreen } from "./stroke.js";

const attr = (spec: NonNullable<ReturnType<typeof renderSpec>>, i = 0) => spec.parts[i]!.attrs;

describe("glyph names", () => {
  it("an unknown name returns null rather than throwing", () => {
    expect(renderSpec("no-such-glyph")).toBeNull();
  });

  // ICONS[name] would pick up prototype methods: they are truthy, pass the
  // existence check and crash the function on def.filter.
  it.each(["toString", "valueOf", "hasOwnProperty", "__proto__", "constructor"])(
    "a prototype name (%s) returns null",
    (name) => {
      expect(() => renderSpec(name)).not.toThrow();
      expect(renderSpec(name)).toBeNull();
    },
  );

  it("hasIcon agrees with renderSpec", () => {
    for (const name of ["bell", "toString", "no-such-glyph", "rocket"]) {
      expect(hasIcon(name)).toBe(renderSpec(name) !== null);
    }
  });
});

describe("stroke width", () => {
  it("on screen it is exactly what was promised, at every size", () => {
    for (const size of [10, 12, 16, 24, 32, 48, 64, 128]) {
      const spec = renderSpec("bell", { size })!;
      const inset = Number(String(spec.svgAttrs["viewBox"]).split(" ")[0]);
      const visible = 24 - 2 * inset;
      expect(spec.strokeAttr * (size / visible)).toBeCloseTo(spec.strokeOnScreen, 10);
      expect(spec.strokeOnScreen).toBeCloseTo(strokeOnScreen(size), 10);
    }
  });

  it("without zoom the conversion still adds up", () => {
    const spec = renderSpec("bell", { size: 48, zoom: false })!;
    expect(spec.svgAttrs["viewBox"]).toBe("0 0 24 24");
    expect(spec.strokeAttr * (48 / 24)).toBeCloseTo(spec.strokeOnScreen, 10);
  });

  // size comes from data and from container measurements — zero and junk are routine there.
  it.each([0, -10, NaN, Infinity])("a degenerate size (%s) puts no NaN into the attributes", (size) => {
    const spec = renderSpec("bell", { size })!;
    expect(Number.isFinite(spec.strokeAttr)).toBe(true);
    expect(Number.isFinite(spec.strokeOnScreen)).toBe(true);
    expect(String(attr(spec)["stroke-width"])).not.toMatch(/NaN|Infinity/);
    expect(Number(spec.svgAttrs["width"])).toBeGreaterThan(0);
  });

  it("absoluteStroke holds the width at any size", () => {
    for (const size of [12, 24, 128]) {
      expect(renderSpec("bell", { size, absoluteStroke: true })!.strokeOnScreen).toBeCloseTo(1.5, 10);
    }
  });
});

describe("parts with a transform", () => {
  // Under non-scaling-stroke the width is measured in viewport coordinates and
  // the viewBox scale does not apply. Such parts need no zoom compensation: with
  // it an instrument body at 128px came out six times thinner than its neighbours.
  const NAME = "__test-with-transform";

  it("get their width in screen pixels, not in viewBox units", () => {
    const icons = ICONS as unknown as Record<string, IconDef>;
    icons[NAME] = [
      { t: "path", d: "M4 4h16", gaps: null, tf: "scale(1.2)" },
      { t: "path", d: "M4 8h16", gaps: null },
    ];
    try {
      for (const size of [24, 48, 128]) {
        const spec = renderSpec(NAME, { size })!;
        const scaled = spec.parts[0]!.attrs;
        const plain = spec.parts[1]!.attrs;
        expect(scaled["vector-effect"]).toBe("non-scaling-stroke");
        expect(scaled["stroke-width"]).toBeCloseTo(spec.strokeOnScreen, 10);
        expect(plain["stroke-width"]).toBeCloseTo(spec.strokeAttr, 10);
      }
    } finally {
      delete icons[NAME];
    }
  });
});

describe("variants and cuts", () => {
  it("A and C keep one cut, B and D keep them all", () => {
    const dashes = (v: "A" | "B" | "C" | "D") =>
      String(renderSpec("bell", { variant: v })!.parts[0]!.attrs["stroke-dasharray"]).split(" ").length;
    expect(dashes("A")).toBeLessThan(dashes("B"));
    expect(dashes("A")).toBe(dashes("C"));
    expect(dashes("B")).toBe(dashes("D"));
  });

  it("solid removes the cuts without touching the data", () => {
    const solid = renderSpec("bell", { solid: true })!;
    expect(solid.parts.every((p) => p.attrs["stroke-dasharray"] === "100 0")).toBe(true);
    expect(ICONS["bell"]![0]!.gaps).toBeTruthy();
  });

  it("the accent is painted with the variable only in C and D", () => {
    const accented = (v: "A" | "B" | "C" | "D") =>
      renderSpec("bell", { variant: v })!.parts.some((p) => String(p.attrs["stroke"]).includes("--tacet-accent"));
    expect(accented("A")).toBe(false);
    expect(accented("B")).toBe(false);
    expect(accented("C")).toBe(true);
    expect(accented("D")).toBe(true);
  });
});

describe("cut-out mask", () => {
  it("the id is built from the name and the suffix", () => {
    const spec = renderSpec("calendar-clock", { idSuffix: "abc" })!;
    expect(spec.mask?.id).toBe("tc-hole-calendar-clock-abc");
  });

  it("anything that could break the attribute is stripped from the suffix", () => {
    const spec = renderSpec("calendar-clock", { idSuffix: 'x" onload="alert(1)' })!;
    expect(spec.mask!.id).toBe("tc-hole-calendar-clock-xonloadalert1");
    expect(spec.mask!.id).not.toMatch(/["'<>() ]/);
  });

  it("a React-style id with colons does not break the reference", () => {
    const spec = renderSpec("calendar-clock", { idSuffix: ":r1:" })!;
    expect(spec.mask!.id).not.toContain(":");
    const masked = spec.parts.find((p) => p.attrs["mask"]);
    if (masked) expect(masked.attrs["mask"]).toBe(`url(#${spec.mask!.id})`);
  });
});

describe("the whole set", () => {
  it("every glyph renders and yields at least one shape", () => {
    for (const name of iconNames()) {
      const spec = renderSpec(name, { size: 24 });
      expect(spec, name).not.toBeNull();
      expect(spec!.parts.length, name).toBeGreaterThan(0);
    }
  });

  it("no NaN or undefined anywhere in the attributes", () => {
    for (const name of iconNames()) {
      for (const part of renderSpec(name, { size: 20 })!.parts) {
        for (const [key, value] of Object.entries(part.attrs)) {
          expect(String(value), `${name}.${key}`).not.toMatch(/NaN|undefined/);
        }
      }
    }
  });
});
