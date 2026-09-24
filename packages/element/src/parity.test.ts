// The React wrapper and <tacet-icon> must produce identical DOM: that is why
// both are built on one renderSpec. Drifting apart quietly is what this prevents.

import { beforeAll, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { Digits, Icon, Text, TextField } from "tacet-react";
import { iconNames } from "tacet-core";
import { defineTacetIcon } from "./TacetIconElement.js";
import { defineTacetDigits } from "./TacetDigitsElement.js";
import { defineTacetText } from "./TacetTextElement.js";
import { defineTacetTextField } from "./TacetTextFieldElement.js";

beforeAll(() => {
  defineTacetIcon();
  defineTacetDigits();
  defineTacetText();
  defineTacetTextField();
});

/** Markup of the React wrapper, parsed into DOM. */
function fromReact(props: Record<string, unknown>): Element {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(createElement(Icon, props as never));
  return host.firstElementChild!;
}

/** Markup of the custom element. */
function fromElement(attrs: Record<string, string>): Element {
  const el = document.createElement("tacet-icon");
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  document.body.appendChild(el);
  const svg = el.querySelector("svg")!;
  return svg;
}

/**
 * The tree of tags and attributes. Mask ids differ between the wrappers by
 * definition (React takes useId, the element a counter), so both the id and the
 * reference to it are normalised: what matters is the linkage, not the strings.
 */
function shape(node: Element): unknown {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(node.attributes)) {
    let value = attr.value;
    if (attr.name === "id") value = "<id>";
    if (attr.name === "mask") value = "url(<id>)";
    // One writes style="overflow:visible", the other sets it as a property.
    if (attr.name === "style") value = value.replace(/\s+/g, "").replace(/;$/, "");
    attrs[attr.name] = value;
  }
  return {
    tag: node.tagName.toLowerCase(),
    attrs,
    children: Array.from(node.children).map(shape),
  };
}

describe("parity of React and the custom element", () => {
  it.each([
    ["bell", { size: 24 }, { name: "bell", size: "24" }],
    ["rocket", { size: 32, variant: "A" }, { name: "rocket", size: "32", variant: "A" }],
    ["bell", { size: 16, solid: true }, { name: "bell", size: "16", solid: "" }],
    ["loading", { size: 48, absoluteStroke: true }, { name: "loading", size: "48", "absolute-stroke": "" }],
    ["calendar-clock", { size: 20 }, { name: "calendar-clock", size: "20" }],
  ])("%s produces identical DOM", (_label, reactProps, elementAttrs) => {
    const a = shape(fromReact({ name: _label, ...reactProps }));
    const b = shape(fromElement(elementAttrs as Record<string, string>));
    expect(b).toEqual(a);
  });

  it("a label enables accessibility the same way", () => {
    const a = fromReact({ name: "bell", size: 24, title: "Notifications" });
    const b = fromElement({ name: "bell", size: "24", label: "Notifications" });
    expect(b.getAttribute("role")).toBe(a.getAttribute("role"));
    expect(b.getAttribute("aria-label")).toBe(a.getAttribute("aria-label"));
    expect(b.querySelector("title")?.textContent).toBe(a.querySelector("title")?.textContent);
  });

  it("without a label both hide the icon from screen readers", () => {
    expect(fromReact({ name: "bell" }).getAttribute("aria-hidden")).toBe("true");
    expect(fromElement({ name: "bell" }).getAttribute("aria-hidden")).toBe("true");
  });

  it("the whole set matches in shape count", () => {
    for (const name of iconNames()) {
      const a = fromReact({ name, size: 24 }).querySelector("g.tc-body")!.children.length;
      const b = fromElement({ name, size: "24" }).querySelector("g.tc-body")!.children.length;
      expect(b, name).toBe(a);
    }
  });
});

describe("the custom element", () => {
  it("re-renders when an attribute changes", () => {
    const el = document.createElement("tacet-icon");
    el.setAttribute("name", "bell");
    document.body.appendChild(el);
    expect(el.querySelector("svg")!.getAttribute("data-icon")).toBe("bell");

    el.setAttribute("name", "rocket");
    expect(el.querySelector("svg")!.getAttribute("data-icon")).toBe("rocket");
    expect(el.querySelectorAll("svg").length).toBe(1);
  });

  it("an unknown name does not take the page down", () => {
    const el = document.createElement("tacet-icon");
    el.setAttribute("name", "no-such-glyph");
    expect(() => document.body.appendChild(el)).not.toThrow();
    expect(el.querySelector("svg")).toBeNull();
  });
});

/** A number from the React wrapper, rendered to static markup and parsed. */
function digitsFromReact(props: Record<string, unknown>): Element {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(createElement(Digits, props as never));
  return host.firstElementChild!;
}

/** A number from the custom element. */
function digitsFromElement(attrs: Record<string, string>): Element {
  const el = document.createElement("tacet-digits");
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  document.body.appendChild(el);
  return el;
}

describe("parity of numbers", () => {
  it.each([
    [{ value: "12:30", size: 32 }, { value: "12:30", size: "32" }],
    [{ value: "1248", variant: "A" }, { value: "1248", variant: "A" }],
    [{ value: "907", size: 18, solid: true }, { value: "907", size: "18", solid: "" }],
  ])("%o produces identical slots", (reactProps, elementAttrs) => {
    const a = Array.from(digitsFromReact(reactProps).children).map(shape);
    const b = Array.from(digitsFromElement(elementAttrs as Record<string, string>).children).map(shape);
    expect(b).toEqual(a);
  });

  it("both label the number with its value", () => {
    expect(digitsFromReact({ value: "42" }).getAttribute("aria-label")).toBe("42");
    expect(digitsFromElement({ value: "42" }).getAttribute("aria-label")).toBe("42");
    expect(digitsFromElement({ value: "42" }).getAttribute("role")).toBe("img");
  });
});

describe("<tacet-digits>", () => {
  it("a new value updates the digits and the label", () => {
    const el = digitsFromElement({ value: "9" });
    el.setAttribute("value", "10");
    expect(Array.from(el.children).map((c) => c.getAttribute("data-char"))).toEqual(["1", "0"]);
    expect(el.getAttribute("aria-label")).toBe("10");
  });

  it("a removed attribute gives the option back", () => {
    const el = digitsFromElement({ value: "8", variant: "A" });
    expect(el.querySelectorAll("path").length).toBe(1);
    el.removeAttribute("variant");
    expect(el.querySelectorAll("path").length).toBe(2);
  });
});

/** A line from the React wrapper, rendered to static markup and parsed. */
function textFromReact(props: Record<string, unknown>): Element {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(createElement(Text, props as never));
  return host.firstElementChild!;
}

/** A line from the custom element. */
function textFromElement(attrs: Record<string, string>): Element {
  const el = document.createElement("tacet-text");
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  document.body.appendChild(el);
  return el;
}

describe("parity of text", () => {
  it.each([
    [{ value: "Привет, мир!", size: 32 }, { value: "Привет, мир!", size: "32" }],
    [{ value: "10:30 — «TACET»", variant: "A" }, { value: "10:30 — «TACET»", variant: "A" }],
    [{ value: "Ёж и Щука", size: 18, solid: true }, { value: "Ёж и Щука", size: "18", solid: "" }],
  ])("%o produces identical words", (reactProps, elementAttrs) => {
    const a = Array.from(textFromReact(reactProps).children).map(shape);
    const b = Array.from(textFromElement(elementAttrs as Record<string, string>).children).map(shape);
    expect(b).toEqual(a);
  });

  it("both label the text with the value as given", () => {
    expect(textFromReact({ value: "Сохранено" }).getAttribute("aria-label")).toBe("Сохранено");
    expect(textFromElement({ value: "Сохранено" }).getAttribute("aria-label")).toBe("Сохранено");
    expect(textFromElement({ value: "Сохранено" }).getAttribute("role")).toBe("img");
  });
});

describe("<tacet-text>", () => {
  it("a new value updates the letters and the label", () => {
    const el = textFromElement({ value: "Черновик" });
    el.setAttribute("value", "Готово");
    expect(Array.from(el.querySelectorAll("svg")).map((svg) => svg.getAttribute("data-char")).join("")).toBe("ГОТОВО");
    expect(el.getAttribute("aria-label")).toBe("Готово");
  });

  it("a removed attribute gives the option back", () => {
    const el = textFromElement({ value: "B", variant: "A" });
    expect(el.querySelectorAll("path").length).toBe(2);
    el.removeAttribute("variant");
    expect(el.querySelectorAll("path").length).toBe(3);
  });
});

describe("<tacet-text-field>", () => {
  const fieldOf = (attrs: Record<string, string>) => {
    const el = document.createElement("tacet-text-field");
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    document.body.appendChild(el);
    return el as HTMLElement & { value: string; input: HTMLInputElement };
  };
  const drawn = (el: Element) =>
    Array.from(el.querySelectorAll(".tc-field svg[data-char]")).map((svg) => svg.getAttribute("data-char")).join("");

  it("holds a real input with the mirrored attributes", () => {
    const el = fieldOf({ value: "Привет", placeholder: "Имя", name: "who", label: "Your name" });
    const input = el.querySelector("input")!;
    expect(input.value).toBe("Привет");
    expect(input.getAttribute("placeholder")).toBe("Имя");
    expect(input.getAttribute("name")).toBe("who");
    expect(input.getAttribute("aria-label")).toBe("Your name");
    expect(drawn(el)).toBe("ПРИВЕТ");
  });

  it("value reads and writes the input, and the letters follow", () => {
    const el = fieldOf({ value: "A" });
    el.value = "Готово";
    expect(el.input.value).toBe("Готово");
    expect(drawn(el)).toBe("ГОТОВО");
  });

  it("the input's events bubble out of the element", () => {
    const el = fieldOf({ value: "" });
    let heard = "";
    el.addEventListener("input", () => { heard = el.value; });
    el.input.value = "ok";
    el.input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(heard).toBe("ok");
    expect(drawn(el)).toBe("OK");
  });

  it("draws what the React field draws", () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(createElement(TextField, { defaultValue: "Ёж и Щука", size: 32 })));
    const el = fieldOf({ value: "Ёж и Щука", size: "32" });
    const layer = (host: Element) => Array.from(host.querySelectorAll(".tc-field svg")).map(shape);
    expect(layer(el)).toEqual(layer(container));
    act(() => root.unmount());
  });
});
