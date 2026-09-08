import { describe, expect, it } from "vitest";
import { resolveOklch } from "./oklch.js";

describe("resolveOklch", () => {
  // The four colours the set actually carries (the priority arrows). Checked
  // against the values a browser resolves them to, so the phone and the web
  // draw the same glyph.
  it("resolves the colours the set carries", () => {
    expect(resolveOklch("oklch(0.62 0.01 256)")).toBe("#82868c");
    expect(resolveOklch("oklch(0.62 0.19 258)")).toBe("#3082f6");
    expect(resolveOklch("oklch(0.8 0.15 84)")).toBe("#ebb432");
    expect(resolveOklch("oklch(0.62 0.2 25)")).toBe("#e64343");
  });

  it("reads lightness as a percentage too", () => {
    expect(resolveOklch("oklch(80% 0.15 84)")).toBe(resolveOklch("oklch(0.8 0.15 84)"));
  });

  it("leaves every other spelling alone", () => {
    for (const value of ["#ff2d55", "currentColor", "none", "rgb(1, 2, 3)", "red"]) {
      expect(resolveOklch(value)).toBe(value);
    }
  });

  it("clamps out-of-gamut instead of wrapping around", () => {
    // A colour outside sRGB is a bug in the glyph; the channel must not fold
    // over into a bright wrong hue while it is being fixed.
    expect(resolveOklch("oklch(1 0.4 140)")).toMatch(/^#[0-9a-f]{6}$/);
  });
});
