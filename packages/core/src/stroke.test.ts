import { describe, expect, it } from "vitest";
import { dashFor, insetFor, normalizeSize, STROKE_AT_24, strokeOnScreen } from "./stroke.js";

describe("the width curve", () => {
  it("matches the given value at the calibration point", () => {
    expect(strokeOnScreen(24)).toBeCloseTo(STROKE_AT_24, 10);
  });

  it("grows with size, but slower than it", () => {
    const at24 = strokeOnScreen(24);
    const at128 = strokeOnScreen(128);
    expect(at128).toBeGreaterThan(at24);
    // The icon grew 5.3×; the stroke must not even grow two and a half times.
    expect(at128 / at24).toBeLessThan(2.5);
  });

  it("on small sizes it repeats the set's old table", () => {
    // The values the glyphs were drawn with: 12px → 1.10, 24px → 1.50.
    expect(strokeOnScreen(12)).toBeCloseTo(1.1, 1);
    expect(strokeOnScreen(24)).toBeCloseTo(1.5, 2);
  });

  it("is monotonic", () => {
    let prev = 0;
    for (const size of [8, 10, 12, 14, 16, 20, 24, 32, 40, 64, 96, 128]) {
      const value = strokeOnScreen(size);
      expect(value).toBeGreaterThan(prev);
      prev = value;
    }
  });

  it.each([0, -1, NaN, Infinity, -Infinity])("a degenerate size (%s) yields no NaN", (size) => {
    expect(Number.isFinite(strokeOnScreen(size))).toBe(true);
    expect(normalizeSize(size)).toBe(24);
  });

  it("an explicit width beats the size", () => {
    expect(strokeOnScreen(128, { strokeWidth: 2 })).toBe(2);
    expect(strokeOnScreen(12, { strokeWidth: 2 })).toBe(2);
  });

  it("junk in strokeWidth never reaches the calculation", () => {
    expect(Number.isFinite(strokeOnScreen(24, { strokeWidth: NaN }))).toBe(true);
  });
});

describe("optical zoom", () => {
  it("small sizes are zoomed less than large ones", () => {
    expect(insetFor(12)).toBeLessThan(insetFor(24));
    expect(insetFor(16)).toBeLessThan(insetFor(20));
  });

  it("past 20px it plateaus", () => {
    expect(insetFor(20)).toBeCloseTo(insetFor(24), 10);
    expect(insetFor(128)).toBeCloseTo(insetFor(24), 10);
  });

  it("never eats more than a fifth of the box", () => {
    for (const size of [8, 12, 16, 24, 64, 128]) {
      expect(24 - 2 * insetFor(size)).toBeGreaterThan(19);
    }
  });
});

describe("cuts", () => {
  it("a pair of cuts unfolds into alternating dash and gap", () => {
    expect(dashFor([[12, 9], [58, 9]])).toBe("12 9 37 9 33");
  });

  const sumOf = (gaps: Array<[number, number]>) =>
    dashFor(gaps).split(" ").reduce((acc, n) => acc + Number(n), 0);

  it("the sum equals the contour length when cuts avoid the edges", () => {
    expect(sumOf([[10, 5], [50, 5], [80, 5]])).toBeCloseTo(100, 6);
    expect(sumOf([[12, 9], [58, 9]])).toBeCloseTo(100, 6);
  });

  it("a cut touching the edge adds a hundredth of a percent", () => {
    // A zero-length segment becomes 0.01 — that is how the set has always been.
    // Invisible to the eye, but exact equality to a hundred cannot be expected.
    for (const gaps of [[[0, 10]], [[90, 10]]] as Array<Array<[number, number]>>) {
      expect(sumOf(gaps)).toBeGreaterThan(100);
      expect(sumOf(gaps)).toBeCloseTo(100, 1);
    }
  });

  it("real data in the set has no edge cuts, so the sums come out even", () => {
    expect(sumOf([[13, 9], [58, 9]])).toBeCloseTo(100, 6);
  });

  it("the order of cuts does not matter", () => {
    expect(dashFor([[58, 9], [12, 9]])).toBe(dashFor([[12, 9], [58, 9]]));
  });

  it("a cut at the very start yields no zero-length segment", () => {
    expect(dashFor([[0, 10]]).startsWith("0 ")).toBe(false);
  });
});
