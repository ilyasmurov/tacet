// Тесты движка анимации. Проверяют то, что руками не увидишь: маску проявления,
// её инвалидацию и то, что состояния снимаются, а не залипают.

import { beforeEach, describe, expect, it } from "vitest";
import { animate, prepare, resetAnimation, resolveAnimateCfg, reverse } from "./animate.js";
import { BODY_CLASS, renderSpec } from "./renderSpec.js";

const SVGNS = "http://www.w3.org/2000/svg";

/** Собирает тот же DOM, что отдают обёртки. */
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

/** Перерисовать тело под другой глиф, как это делает React при смене пропа. */
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

describe("маска проявления", () => {
  it("строится по фигурам глифа", () => {
    const svg = draw("bell");
    animate(svg, cfg);
    expect(svg.querySelector("mask")).not.toBeNull();
    expect(maskShapes(svg).length).toBeGreaterThan(0);
  });

  it("пересобирается, когда глиф сменился", () => {
    const svg = draw("clock");
    animate(svg, cfg);
    const before = maskShapes(svg);
    const idBefore = svg.querySelector("mask")!.id;

    swapGlyph(svg, "building");
    animate(svg, cfg);
    const after = maskShapes(svg);

    // Иначе новый глиф проявляется через силуэт старого — на экране огрызок.
    expect(after.length).not.toBe(before.length);
    expect(svg.querySelector("mask")!.id).not.toBe(idBefore);
    expect(svg.querySelectorAll("mask").length).toBe(1);
  });

  it("переиспользуется, пока глиф тот же", () => {
    const svg = draw("bell");
    animate(svg, cfg);
    const id = svg.querySelector("mask")!.id;
    animate(svg, cfg);
    expect(svg.querySelector("mask")!.id).toBe(id);
    expect(svg.querySelectorAll("mask").length).toBe(1);
  });
});

describe("обратный ход и повторное появление", () => {
  it("после reverse иконка возвращается, а не гаснет навсегда", () => {
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

  it("возврат живых фигур не портит маску проявления", () => {
    const svg = draw("bell");
    reverse(svg);
    animate(svg, cfg);
    // У клонов свой рабочий dasharray; перепиши им исходный — проявление встанет.
    for (const clone of svg.querySelectorAll<SVGElement>("mask [data-rev]")) {
      expect(clone.getAttribute("stroke-dasharray")).toBe("100 100");
      expect(clone.hasAttribute("data-dash")).toBe(false);
    }
  });
});

describe("снятие состояния", () => {
  it("prepare без animate оставляет иконку скрытой, resetAnimation её возвращает", () => {
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

  it("после сброса анимация играется заново", () => {
    const svg = draw("bell");
    animate(svg, cfg);
    resetAnimation(svg);
    expect(() => animate(svg, cfg)).not.toThrow();
    expect(svg.querySelectorAll("mask").length).toBe(1);
  });
});

describe("режимы", () => {
  it("pop и fade работают без маски", () => {
    for (const mode of ["pop", "fade"] as const) {
      const svg = draw("bell");
      animate(svg, resolveAnimateCfg("bell", { mode }));
      expect(svg.querySelector("mask")).toBeNull();
      expect(svg.querySelector<SVGGElement>(`g.${BODY_CLASS}`)!.style.opacity).toBe("1");
    }
  });

  it("spin доворачивает сам svg", () => {
    const svg = draw("loading");
    animate(svg, resolveAnimateCfg("loading", { mode: "spin", spinDeg: 90 }));
    expect(svg.style.transform).toContain("rotate");
  });

  it("без тела анимация молчит, а не падает", () => {
    const svg = document.createElementNS(SVGNS, "svg") as SVGSVGElement;
    expect(() => animate(svg, cfg)).not.toThrow();
    expect(() => resetAnimation(svg)).not.toThrow();
  });
});
