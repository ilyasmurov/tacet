// React-обёртка и <tacet-icon> обязаны давать одинаковый DOM: ради этого обе
// и построены поверх одного renderSpec. Разъедутся молча — этот тест не даст.

import { beforeAll, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Icon } from "tacet";
import { iconNames } from "@tacet/core";
import { defineTacetIcon } from "./TacetIconElement.js";

beforeAll(() => {
  defineTacetIcon();
});

/** Разметка React-обёртки, разобранная в DOM. */
function fromReact(props: Record<string, unknown>): Element {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(createElement(Icon, props as never));
  return host.firstElementChild!;
}

/** Разметка веб-компонента. */
function fromElement(attrs: Record<string, string>): Element {
  const el = document.createElement("tacet-icon");
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  document.body.appendChild(el);
  const svg = el.querySelector("svg")!;
  return svg;
}

/**
 * Дерево тегов и атрибутов. Идентификаторы масок у обёрток свои по определению
 * (React берёт useId, элемент — счётчик), поэтому и id, и ссылку на него
 * приводим к одному виду: сравнивать надо связность, а не сами строки.
 */
function shape(node: Element): unknown {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(node.attributes)) {
    let value = attr.value;
    if (attr.name === "id") value = "<id>";
    if (attr.name === "mask") value = "url(<id>)";
    // Один пишет style="overflow:visible", другой — через свойство.
    if (attr.name === "style") value = value.replace(/\s+/g, "").replace(/;$/, "");
    attrs[attr.name] = value;
  }
  return {
    tag: node.tagName.toLowerCase(),
    attrs,
    children: Array.from(node.children).map(shape),
  };
}

describe("паритет React и веб-компонента", () => {
  it.each([
    ["bell", { size: 24 }, { name: "bell", size: "24" }],
    ["rocket", { size: 32, variant: "A" }, { name: "rocket", size: "32", variant: "A" }],
    ["bell", { size: 16, solid: true }, { name: "bell", size: "16", solid: "" }],
    ["loading", { size: 48, absoluteStroke: true }, { name: "loading", size: "48", "absolute-stroke": "" }],
    ["calendar-clock", { size: 20 }, { name: "calendar-clock", size: "20" }],
  ])("%s даёт одинаковый DOM", (_label, reactProps, elementAttrs) => {
    const a = shape(fromReact({ name: _label, ...reactProps }));
    const b = shape(fromElement(elementAttrs as Record<string, string>));
    expect(b).toEqual(a);
  });

  it("подпись одинаково включает доступность", () => {
    const a = fromReact({ name: "bell", size: 24, title: "Уведомления" });
    const b = fromElement({ name: "bell", size: "24", label: "Уведомления" });
    expect(b.getAttribute("role")).toBe(a.getAttribute("role"));
    expect(b.getAttribute("aria-label")).toBe(a.getAttribute("aria-label"));
    expect(b.querySelector("title")?.textContent).toBe(a.querySelector("title")?.textContent);
  });

  it("без подписи обе прячут иконку от скринридера", () => {
    expect(fromReact({ name: "bell" }).getAttribute("aria-hidden")).toBe("true");
    expect(fromElement({ name: "bell" }).getAttribute("aria-hidden")).toBe("true");
  });

  it("весь набор совпадает по числу фигур", () => {
    for (const name of iconNames()) {
      const a = fromReact({ name, size: 24 }).querySelector("g.tc-body")!.children.length;
      const b = fromElement({ name, size: "24" }).querySelector("g.tc-body")!.children.length;
      expect(b, name).toBe(a);
    }
  });
});

describe("веб-компонент", () => {
  it("перерисовывается при смене атрибута", () => {
    const el = document.createElement("tacet-icon");
    el.setAttribute("name", "bell");
    document.body.appendChild(el);
    expect(el.querySelector("svg")!.getAttribute("data-icon")).toBe("bell");

    el.setAttribute("name", "rocket");
    expect(el.querySelector("svg")!.getAttribute("data-icon")).toBe("rocket");
    expect(el.querySelectorAll("svg").length).toBe(1);
  });

  it("неизвестное имя не роняет страницу", () => {
    const el = document.createElement("tacet-icon");
    el.setAttribute("name", "нет-такого");
    expect(() => document.body.appendChild(el)).not.toThrow();
    expect(el.querySelector("svg")).toBeNull();
  });
});
