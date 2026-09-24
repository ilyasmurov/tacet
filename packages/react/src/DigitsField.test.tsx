import { afterEach, describe, expect, it } from "vitest";
import { act, createElement, createRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { DigitsField } from "./DigitsField.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const drawn = (host: Element) =>
  Array.from(host.querySelectorAll(".tc-field svg[data-char]")).map((svg) => svg.getAttribute("data-char")).join("");

/** Types as a browser does: the value lands in the input past React's own watch on it, then an input event. */
function typeInto(input: HTMLInputElement, value: string): void {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.setSelectionRange(value.length, value.length);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

let root: Root | null = null;
afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.textContent = "";
});

function mount(node: ReturnType<typeof createElement>): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(node));
  return container;
}

describe("DigitsField", () => {
  it("is a plain input on the server, before any script", () => {
    const html = renderToStaticMarkup(createElement(DigitsField, { defaultValue: "12", name: "count", className: "box" }));
    const host = document.createElement("div");
    host.innerHTML = html;
    const input = host.querySelector("input")!;
    expect(host.firstElementChild!.className).toBe("box");
    expect(input.getAttribute("name")).toBe("count");
    expect(input.getAttribute("value")).toBe("12");
  });

  it("draws the value once mounted and hands the ref to the input", () => {
    const ref = createRef<HTMLInputElement>();
    const container = mount(createElement(DigitsField, { defaultValue: "12:30", ref }));
    expect(drawn(container)).toBe("12:30");
    expect(ref.current).toBe(container.querySelector("input"));
  });

  it("a controlled value gets what the field keeps of what is typed", () => {
    let value = "";
    function Form() {
      const [state, setState] = useState("12");
      value = state;
      return createElement(DigitsField, { value: state, onChange: (e) => setState(e.target.value) });
    }
    const container = mount(createElement(Form));
    const input = container.querySelector("input")!;
    act(() => typeInto(input, "123a"));
    expect(value).toBe("123");
    expect(input.value).toBe("123");
    expect(drawn(container)).toBe("123");
  });

  it("an option change redraws the digits", () => {
    const container = mount(createElement(DigitsField, { defaultValue: "8", size: 24 }));
    const width = () => container.querySelector(".tc-field svg")!.getAttribute("width");
    const before = width();
    act(() => root!.render(createElement(DigitsField, { defaultValue: "8", size: 48 })));
    expect(Number(width())).toBeCloseTo(Number(before) * 2, 0);
  });
});
