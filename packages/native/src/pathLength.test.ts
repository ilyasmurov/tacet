import { describe, expect, it } from "vitest";
import { dashInUnits, partLength } from "./pathLength.js";
import type { Part } from "tacet-core";

describe("partLength", () => {
  it("measures a circle by formula", () => {
    expect(partLength({ t: "circle", cx: 12, cy: 12, r: 10 } as Part)).toBeCloseTo(2 * Math.PI * 10);
  });

  it("measures a rounded rectangle: straight runs plus four arcs", () => {
    const square = partLength({ t: "rect", x: 2, y: 2, w: 20, h: 20, rx: 0 } as Part);
    expect(square).toBeCloseTo(80);
    const rounded = partLength({ t: "rect", x: 2, y: 2, w: 20, h: 20, rx: 5 } as Part)!;
    // Corners cut off straight runs and add arcs, so it comes out shorter.
    expect(rounded).toBeLessThan(square!);
  });

  it("measures an arbitrary path", () => {
    // A straight line from 0,0 to 10,0 — no measurer needed to know it is 10.
    expect(partLength({ t: "path", d: "M0 0 L10 0" } as Part)).toBeCloseTo(10);
  });

  it("an unreadable path does not lose the icon", () => {
    // Without a length the glyph is drawn solid — that is a whole icon, unlike a
    // crash in the middle of a screen.
    expect(partLength({ t: "path", d: "нет такого пути" } as Part)).toBeNull();
    expect(partLength({ t: "path" } as Part)).toBeNull();
    expect(partLength({ t: "hole" } as Part)).toBeNull();
  });
});

describe("dashInUnits", () => {
  it("turns shares of a hundred into units of length", () => {
    expect(dashInUnits("50 25 25", 200)).toEqual([100, 50, 50]);
  });

  it("takes the spelling the engine emits, commas included", () => {
    expect(dashInUnits("10,20", 100)).toEqual([10, 20]);
  });

  it("gives up on an unreadable dash instead of shifting the roles", () => {
    // Dropping the bad number would turn the gap that follows into a stroke.
    // Without a dash the contour is drawn solid — whole, if not cut.
    expect(dashInUnits("50 abc 50", 100)).toBeNull();
    expect(dashInUnits("", 100)).toBeNull();
  });
});
