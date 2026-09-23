import { afterEach, describe, expect, it } from "vitest";
import { easeInOutCubic, lerpInto, pairUp, pointsToPath, sampleContour, unpair } from "./morph.js";

type Measurable = { getTotalLength?: unknown; getPointAtLength?: unknown };
const proto = SVGElement.prototype as unknown as Measurable;

afterEach(() => {
  delete proto.getTotalLength;
  delete proto.getPointAtLength;
});

describe("sampleContour", () => {
  it("returns null where the browser cannot measure a path", () => {
    expect(sampleContour("M0 0H10")).toBeNull();
  });

  it("lays the contour out as evenly spaced points, first to last", () => {
    // A 100-unit horizontal line, measured by a stand-in for the browser.
    proto.getTotalLength = () => 100;
    proto.getPointAtLength = (at: number) => ({ x: at, y: 5 });
    const points = sampleContour("M0 5H100", 5)!;
    expect(points).toEqual([0, 5, 25, 5, 50, 5, 75, 5, 100, 5]);
  });

  it("measures a contour once", () => {
    let calls = 0;
    proto.getTotalLength = () => { calls++; return 10; };
    proto.getPointAtLength = (at: number) => ({ x: at, y: 0 });
    sampleContour("M0 0H10-once", 3);
    sampleContour("M0 0H10-once", 3);
    expect(calls).toBe(1);
  });
});

describe("pairUp and unpair", () => {
  it("two pairs come out sorted", () => {
    expect(pairUp([[88, 6], [56, 6]])).toEqual([56, 6, 88, 6]);
  });

  it("a single pair gets a zero-width partner out of its way", () => {
    expect(pairUp([[26, 7]])).toEqual([26, 7, 80, 0]);
    expect(pairUp([[62, 9]])).toEqual([20, 0, 62, 9]);
  });

  it("no pairs become two zero-width ones", () => {
    expect(pairUp(null)).toEqual([30, 0, 80, 0]);
    expect(pairUp([])).toEqual([30, 0, 80, 0]);
  });

  it("unpair drops the zero-width ones", () => {
    expect(unpair([26, 7, 80, 0])).toEqual([[26, 7]]);
    expect(unpair([30, 0, 80, 0])).toEqual([]);
  });
});

describe("interpolation", () => {
  it("the easing starts at 0, ends at 1 and passes the middle at the middle", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
  });

  it("lerpInto fills the given array", () => {
    const out = [0, 0];
    expect(lerpInto(out, [0, 10], [10, 30], 0.5)).toBe(out);
    expect(out).toEqual([5, 20]);
  });

  it("pointsToPath draws a polyline", () => {
    expect(pointsToPath([1, 2, 3.456, 4])).toBe("M1 2L3.46 4");
  });
});
