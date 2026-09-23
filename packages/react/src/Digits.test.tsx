import { afterEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { Digits } from "./Digits.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const chars = (host: Element) =>
  Array.from(host.querySelectorAll("svg")).map((svg) => svg.getAttribute("data-char"));

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.textContent = "";
});

function mount(props: Parameters<typeof Digits>[0]): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(createElement(Digits, props)));
  return container;
}

describe("Digits", () => {
  it("renders the digits on the server, before any script", () => {
    const host = document.createElement("div");
    host.innerHTML = renderToStaticMarkup(createElement(Digits, { value: "12:30", size: 32 }));
    const span = host.firstElementChild!;
    expect(span.getAttribute("role")).toBe("img");
    expect(span.getAttribute("aria-label")).toBe("12:30");
    expect(chars(span)).toEqual(["1", "2", ":", "3", "0"]);
  });

  it("a new value reaches the DOM", () => {
    const container = mount({ value: 9 });
    act(() => root!.render(createElement(Digits, { value: 10 })));
    const span = container.firstElementChild!;
    expect(chars(span)).toEqual(["1", "0"]);
    expect(span.getAttribute("aria-label")).toBe("10");
  });

  it("the title replaces the value as the label", () => {
    const container = mount({ value: "5", title: "Five unread" });
    expect(container.firstElementChild!.getAttribute("aria-label")).toBe("Five unread");
  });

  it("an option change redraws through the controller", () => {
    const container = mount({ value: "8", variant: "D" });
    const span = container.firstElementChild!;
    expect(span.querySelectorAll("path").length).toBe(2);
    act(() => root!.render(createElement(Digits, { value: "8", variant: "A" })));
    expect(span.querySelectorAll("path").length).toBe(1);
  });
});
