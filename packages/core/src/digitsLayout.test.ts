import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COLON_ADVANCE, DIGIT_ADVANCE, SLOT_CLASS, digitGeometry, digitsMarkup, parseDigits, slotSpec,
} from "./digitsLayout.js";
import { BODY_CLASS, renderSpec } from "./renderSpec.js";
import { insetFor } from "./stroke.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseDigits", () => {
  it("keeps digits and the colon", () => {
    expect(parseDigits("12:30")).toBe("12:30");
    expect(parseDigits(1248)).toBe("1248");
  });

  it("drops everything else and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseDigits("1 248.5")).toBe("12485");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("stays quiet when there is nothing to drop", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    parseDigits("0042");
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("slotSpec", () => {
  it("a digit slot is narrowed to the advance and keeps the icon's vertical zoom", () => {
    for (const size of [16, 24, 48]) {
      const inset = insetFor(size);
      const visible = 24 - 2 * inset;
      const slot = slotSpec("7", { size });
      expect(slot.svgAttrs["viewBox"]).toBe(`${12 - DIGIT_ADVANCE / 2} ${inset} ${DIGIT_ADVANCE} ${visible}`);
      expect(slot.svgAttrs["height"]).toBe(size);
      expect(slot.svgAttrs["width"]).toBeCloseTo((DIGIT_ADVANCE * size) / visible, 2);
    }
  });

  it("a digit inside a number is stroked exactly like the icon of the same size", () => {
    const icon = renderSpec("digit-4", { size: 40 })!;
    const slot = slotSpec("4", { size: 40 });
    expect(slot.parts).toEqual(icon.parts);
  });

  it("variant and solid reach the glyph", () => {
    expect(slotSpec("0", { variant: "A" }).parts).toHaveLength(1);
    expect(slotSpec("0", { variant: "D" }).parts).toHaveLength(2);
    expect(slotSpec("0", { solid: true }).parts[0]!.attrs["stroke-dasharray"]).toBe("100 0");
  });

  it("the colon is two dots as heavy as the stroke", () => {
    const slot = slotSpec(":", { size: 24 });
    const stroke = renderSpec("digit-1", { size: 24 })!.strokeAttr;
    expect(slot.svgAttrs["viewBox"]).toBe(`${12 - COLON_ADVANCE / 2} ${insetFor(24)} ${COLON_ADVANCE} ${24 - 2 * insetFor(24)}`);
    expect(slot.parts.map((p) => p.tag)).toEqual(["circle", "circle"]);
    expect(Number(slot.parts[0]!.attrs["r"])).toBeCloseTo(stroke * 0.62, 2);
    expect(slot.parts[0]!.attrs["fill"]).toBe("currentColor");
  });
});

describe("digitGeometry", () => {
  it("D keeps every cut and shows the accent", () => {
    const g = digitGeometry("3");
    expect(g.cuts).toEqual([[22, 7], [73, 7]]);
    expect(g.spans).toEqual([[0, 47]]);
  });

  it("A and C keep the first cut only, and only C and D carry the accent", () => {
    expect(digitGeometry("8", { variant: "A" }).cuts).toEqual([[88, 6]]);
    expect(digitGeometry("8", { variant: "A" }).spans).toBeNull();
    expect(digitGeometry("8", { variant: "C" }).spans).toEqual([[0, 23], [94, 6]]);
  });

  it("solid drops the cuts but keeps the accent", () => {
    const g = digitGeometry("0", { solid: true });
    expect(g.cuts).toEqual([]);
    expect(g.spans).toEqual([[22, 40]]);
  });
});

describe("digitsMarkup", () => {
  it("one hidden svg per character, each with a body group", () => {
    const host = document.createElement("span");
    host.innerHTML = digitsMarkup("12:30", { size: 32 });
    const slots = Array.from(host.children);
    expect(slots.map((s) => s.getAttribute("data-char"))).toEqual(["1", "2", ":", "3", "0"]);
    for (const slot of slots) {
      expect(slot.tagName.toLowerCase()).toBe("svg");
      expect(slot.getAttribute("class")).toBe(SLOT_CLASS);
      expect(slot.getAttribute("aria-hidden")).toBe("true");
      expect(slot.querySelector(`g.${BODY_CLASS}`)).not.toBeNull();
    }
  });

  it("escapes what comes from the caller", () => {
    const markup = digitsMarkup("1", { accentColor: '"><script>' });
    expect(markup).not.toContain("<script>");
    // The accent span carries the colour; quotes and brackets come out escaped.
    expect(markup).toContain('stroke="&quot;>&lt;script>"');
  });
});
