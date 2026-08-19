import { describe, expect, it } from "vitest";
import { toNativeAttrs } from "./nativeAttrs.js";

const colors = { color: "#18181b", accentColor: "#2563eb" };
const dash = (d: string, length: number) => d.split(" ").map((n) => (Number(n) * length) / 100);

describe("toNativeAttrs", () => {
  it("drops pathLength: react-native-svg has none, and cuts would be read as units", () => {
    const out = toNativeAttrs({ pathLength: 100, d: "M0 0" }, colors, 100, dash);
    expect(out["pathLength"]).toBeUndefined();
    expect(out["d"]).toBe("M0 0");
  });

  it("resolves currentColor: there is no cascade to inherit from", () => {
    const out = toNativeAttrs({ stroke: "currentColor", fill: "none" }, colors, null, dash);
    expect(out["stroke"]).toBe("#18181b");
    expect(out["fill"]).toBe("none");
  });

  it("resolves the accent variable", () => {
    const out = toNativeAttrs({ stroke: "var(--tacet-accent, currentColor)" }, colors, null, dash);
    expect(out["stroke"]).toBe("#2563eb");
  });

  it("keeps a hard-coded colour from the set", () => {
    const out = toNativeAttrs({ fill: "#ff2d55" }, colors, null, dash);
    expect(out["fill"]).toBe("#ff2d55");
  });

  it("turns cuts into units", () => {
    const out = toNativeAttrs({ "stroke-dasharray": "50 50" }, colors, 200, dash);
    expect(out["strokeDasharray"]).toEqual([100, 100]);
  });

  it("without a length draws the contour solid instead of a dotted mess", () => {
    // Percentages taken for units would cut a 24-unit glyph into fifty pieces.
    const out = toNativeAttrs({ "stroke-dasharray": "50 50" }, colors, null, dash);
    expect(out["strokeDasharray"]).toBeUndefined();
  });

  it("translates names into the spelling react-native-svg expects", () => {
    const out = toNativeAttrs({ "stroke-width": 2, "stroke-linecap": "round" }, colors, null, dash);
    expect(out["strokeWidth"]).toBe(2);
    expect(out["strokeLinecap"]).toBe("round");
  });

  it("keeps non-scaling-stroke: react-native-svg supports it, and the engine relies on it", () => {
    // For a transformed part the engine writes the width in screen pixels,
    // expecting the viewport to measure it. Without the attribute a violin body
    // comes out six times thicker than its own neck at 128px.
    const out = toNativeAttrs({ "vector-effect": "non-scaling-stroke" }, colors, null, dash);
    expect(out["vectorEffect"]).toBe("non-scaling-stroke");
  });

  it("keeps the per-part mask: the engine masks parts, not the whole glyph", () => {
    // Mask the group instead and a calendar loses the clock that lives inside
    // the cut-out: it is not masked, but the group mask burns it away.
    const out = toNativeAttrs({ mask: "url(#tc-hole-calendar-clock)" }, colors, null, dash);
    expect(out["mask"]).toBe("url(#tc-hole-calendar-clock)");
  });

  it("drops service data-attributes", () => {
    const out = toNativeAttrs({ "data-dash": "50 50", "data-mk": "1" }, colors, 100, dash);
    expect(Object.keys(out)).toHaveLength(0);
  });
});
