// Tests for the animation engine. They cover what you cannot see by hand: the
// reveal mask, its invalidation, and that states come off instead of sticking.

import { beforeEach, describe, expect, it } from "vitest";
import { animate, prepare, resetAnimation, resolveAnimateCfg, reverse } from "./animate.js";
import { BODY_CLASS, renderSpec } from "./renderSpec.js";

const SVGNS = "http://www.w3.org/2000/svg";

/** Builds the same DOM the wrappers produce. */
function draw(name: string, size = 24): SVGSVGElement {
  const spec = renderSpec(name, { size })!;
  const svg = document.createElementNS(SVGNS, "svg") as SVGSVGElement;
  for (const [key, value] of Object.entries(spec.svgAttrs)) svg.setAttribute(key, String(value));
  const body = document.createElementNS(SVGNS, "g");
  body.setAttribute("class", BODY_CLASS);
  for (const part of spec.parts) {
    const el = document.createElementNS(SVGNS, part.tag);
    for (const [key, value] of Object.entries(part.attrs)) el.setAttribute(key, String(value));
    body.appendChild(el);
  }
  svg.appendChild(body);
  document.body.appendChild(svg);
  return svg;
}

/** Re-render the body for another glyph, the way React does on a prop change. */
function swapGlyph(svg: SVGSVGElement, name: string): void {
  const spec = renderSpec(name, { size: 24 })!;
  const body = svg.querySelector(`g.${BODY_CLASS}`)!;
  body.textContent = "";
  svg.setAttribute("data-icon", name);
  for (const part of spec.parts) {
    const el = document.createElementNS(SVGNS, part.tag);
    for (const [key, value] of Object.entries(part.attrs)) el.setAttribute(key, String(value));
    body.appendChild(el);
  }
}

const cfg = resolveAnimateCfg("bell");
const maskShapes = (svg: SVGSVGElement) =>
  Array.from(svg.querySelectorAll("mask [data-rev], mask [data-fillrev]")).map((el) => el.tagName);

beforeEach(() => {
  document.body.textContent = "";
});

describe("the reveal mask", () => {
  it("is built from the glyph shapes", () => {
    const svg = draw("bell");
    animate(svg, cfg);
    expect(svg.querySelector("mask")).not.toBeNull();
    expect(maskShapes(svg).length).toBeGreaterThan(0);
  });

  it("is rebuilt when the glyph changes", () => {
    const svg = draw("clock");
    animate(svg, cfg);
    const before = maskShapes(svg);
    const idBefore = svg.querySelector("mask")!.id;

    swapGlyph(svg, "building");
    animate(svg, cfg);
    const after = maskShapes(svg);

    // Otherwise the new glyph reveals through the old silhouette — a stump on screen.
    expect(after.length).not.toBe(before.length);
    expect(svg.querySelector("mask")!.id).not.toBe(idBefore);
    expect(svg.querySelectorAll("mask").length).toBe(1);
  });

  it("is reused while the glyph stays the same", () => {
    const svg = draw("bell");
    animate(svg, cfg);
    const id = svg.querySelector("mask")!.id;
    animate(svg, cfg);
    expect(svg.querySelector("mask")!.id).toBe(id);
    expect(svg.querySelectorAll("mask").length).toBe(1);
  });
});

describe("reverse and re-entrance", () => {
  it("after reverse the icon comes back instead of going dark for good", () => {
    const svg = draw("loading");
    const live = () => Array.from(svg.querySelectorAll<SVGElement>(`g.${BODY_CLASS} [data-dash]`));

    reverse(svg);
    expect(live().every((el) => el.style.opacity === "0")).toBe(true);

    animate(svg, cfg);

    for (const el of live()) {
      expect(el.style.opacity).not.toBe("0");
      expect(el.style.strokeDasharray).toBe(el.dataset["dash"]);
    }
  });

  it("restoring live shapes does not spoil the reveal mask", () => {
    const svg = draw("bell");
    reverse(svg);
    animate(svg, cfg);
    // Clones have their own working dasharray; overwrite it and the reveal stalls.
    for (const clone of svg.querySelectorAll<SVGElement>("mask [data-rev]")) {
      expect(clone.getAttribute("stroke-dasharray")).toBe("100 100");
      expect(clone.hasAttribute("data-dash")).toBe(false);
    }
  });
});

describe("clearing the state", () => {
  it("prepare without animate leaves the icon hidden, resetAnimation brings it back", () => {
    const svg = draw("rocket");
    prepare(svg, cfg);
    const body = svg.querySelector<SVGGElement>(`g.${BODY_CLASS}`)!;
    expect(body.getAttribute("mask")).toBeTruthy();

    resetAnimation(svg);

    expect(body.getAttribute("mask")).toBeNull();
    expect(svg.querySelector("mask")).toBeNull();
    expect(body.style.opacity).toBe("");
    expect(body.style.transform).toBe("");
  });

  it("after a reset the animation plays again", () => {
    const svg = draw("bell");
    animate(svg, cfg);
    resetAnimation(svg);
    expect(() => animate(svg, cfg)).not.toThrow();
    expect(svg.querySelectorAll("mask").length).toBe(1);
  });
});

describe("modes", () => {
  it("pop and fade work without a mask", () => {
    for (const mode of ["pop", "fade"] as const) {
      const svg = draw("bell");
      animate(svg, resolveAnimateCfg("bell", { mode }));
      expect(svg.querySelector("mask")).toBeNull();
      expect(svg.querySelector<SVGGElement>(`g.${BODY_CLASS}`)!.style.opacity).toBe("1");
    }
  });

  it("spin rotates the svg itself", () => {
    const svg = draw("loading");
    animate(svg, resolveAnimateCfg("loading", { mode: "spin", spinDeg: 90 }));
    expect(svg.style.transform).toContain("rotate");
  });

  it("without a body the animation stays quiet instead of crashing", () => {
    const svg = document.createElementNS(SVGNS, "svg") as SVGSVGElement;
    expect(() => animate(svg, cfg)).not.toThrow();
    expect(() => resetAnimation(svg)).not.toThrow();
  });
});
