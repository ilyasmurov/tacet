import { describe, expect, it } from "vitest";
import { accentDash } from "./accent.js";

const sum = (dash: string) => dash.split(" ").reduce((acc, n) => acc + Number(n), 0);

describe("accentDash", () => {
  it("a span with no cuts is one piece, shifted into place", () => {
    expect(accentDash([[22, 40]], [])).toEqual({ dash: "40 60", offset: -22 });
  });

  it("a span starting at zero needs no shift", () => {
    expect(accentDash([[0, 29]], [[70, 8]])).toEqual({ dash: "29 71", offset: 0 });
  });

  it("a cut inside the span splits it in two", () => {
    // digit-3: the top bowl is the accent, one of its cuts falls inside.
    expect(accentDash([[0, 47]], [[22, 7], [73, 7]])).toEqual({ dash: "22 7 18 53", offset: 0 });
  });

  it("a cut touching the span edge changes nothing", () => {
    // digit-0: the accent runs exactly between its two cuts.
    expect(accentDash([[22, 40]], [[13, 9], [62, 9]])).toEqual({ dash: "40 60", offset: -22 });
  });

  it("two spans, including one that ends the contour", () => {
    // digit-8: top of the upper loop, from the cut over the start to the crossing.
    expect(accentDash([[0, 23], [94, 6]], [[88, 6], [56, 6]])).toEqual({ dash: "23 71 6 0", offset: 0 });
  });

  it("a span swallowed by a cut leaves nothing to draw", () => {
    expect(accentDash([[40, 5]], [[38, 10]])).toBeNull();
  });

  it("slivers are dropped rather than drawn as dots", () => {
    expect(accentDash([[10, 20]], [[10.1, 19.8]])).toBeNull();
  });

  it("spans reaching past the contour are clamped", () => {
    expect(accentDash([[90, 30]], [])).toEqual({ dash: "10 90", offset: -90 });
  });

  it("every pattern covers exactly the contour length", () => {
    const cases: Array<[Array<[number, number]>, Array<[number, number]>]> = [
      [[[0, 47]], [[22, 7], [73, 7]]],
      [[[0, 23], [94, 6]], [[88, 6], [56, 6]]],
      [[[74, 26]], [[24, 8]]],
      [[[86, 14]], []],
    ];
    for (const [spans, cuts] of cases) {
      expect(sum(accentDash(spans, cuts)!.dash)).toBeCloseTo(100, 10);
    }
  });
});
