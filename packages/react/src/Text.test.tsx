import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { Text } from "./Text.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const chars = (host: Element) =>
  Array.from(host.querySelectorAll("svg")).map((svg) => svg.getAttribute("data-char")).join("");

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.textContent = "";
});

function mount(props: Parameters<typeof Text>[0]): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(createElement(Text, props)));
  return container;
}

describe("Text", () => {
  it("renders the letters on the server, before any script", () => {
    const host = document.createElement("div");
    host.innerHTML = renderToStaticMarkup(createElement(Text, { value: "Привет, мир", size: 32 }));
    const span = host.firstElementChild!;
    expect(span.getAttribute("role")).toBe("img");
    expect(span.getAttribute("aria-label")).toBe("Привет, мир");
    expect(chars(span)).toBe("ПРИВЕТ,МИР");
  });

  it("a new value reaches the DOM and the label", () => {
    const container = mount({ value: "Черновик" });
    act(() => root!.render(createElement(Text, { value: "Готово" })));
    const span = container.firstElementChild!;
    expect(chars(span)).toBe("ГОТОВО");
    expect(span.getAttribute("aria-label")).toBe("Готово");
  });

  it("the title replaces the value as the label", () => {
    const container = mount({ value: "OK", title: "Saved" });
    expect(container.firstElementChild!.getAttribute("aria-label")).toBe("Saved");
  });

  it("an option change redraws through the controller", () => {
    const container = mount({ value: "B", variant: "D" });
    const span = container.firstElementChild!;
    expect(span.querySelectorAll("path").length).toBe(3);
    act(() => root!.render(createElement(Text, { value: "B", variant: "A" })));
    expect(span.querySelectorAll("path").length).toBe(2);
  });
});
