import { afterEach, describe, expect, it } from "vitest";
import { act, createElement, createRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { TextField } from "./TextField.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const drawn = (host: Element) =>
  Array.from(host.querySelectorAll(".tc-field svg[data-char]")).map((svg) => svg.getAttribute("data-char")).join("");

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

describe("TextField", () => {
  it("is a plain input on the server, before any script", () => {
    const html = renderToStaticMarkup(createElement(TextField, { defaultValue: "Привет", name: "greeting", className: "box" }));
    const host = document.createElement("div");
    host.innerHTML = html;
    const input = host.querySelector("input")!;
    expect(host.firstElementChild!.className).toBe("box");
    expect(input.getAttribute("name")).toBe("greeting");
    expect(input.getAttribute("value")).toBe("Привет");
  });

  it("draws the value once mounted and hands the ref to the input", () => {
    const ref = createRef<HTMLInputElement>();
    const container = mount(createElement(TextField, { defaultValue: "Привет", ref }));
    expect(drawn(container)).toBe("ПРИВЕТ");
    expect(ref.current).toBe(container.querySelector("input"));
  });

  it("follows a controlled value", () => {
    let set: (value: string) => void = () => {};
    function Form() {
      const [value, setValue] = useState("Черновик");
      set = setValue;
      return createElement(TextField, { value, onChange: (e) => setValue(e.target.value) });
    }
    const container = mount(createElement(Form));
    act(() => set("Готово"));
    expect(drawn(container)).toBe("ГОТОВО");
  });

  it("an option change redraws the letters", () => {
    const container = mount(createElement(TextField, { defaultValue: "B", variant: "D" }));
    expect(container.querySelectorAll(".tc-field path").length).toBe(3);
    act(() => root!.render(createElement(TextField, { defaultValue: "B", variant: "A" })));
    expect(container.querySelectorAll(".tc-field path").length).toBe(2);
  });
});
