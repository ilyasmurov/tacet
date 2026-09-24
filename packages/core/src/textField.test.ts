// Tests for the text field. jsdom has no layout and no Web Animations: the
// field draws still, every rect is at 0, and that is enough to check what the
// field draws, where the caret and the selection go and where a click lands.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { strokeOnScreen } from "./stroke.js";
import { createTextField, fieldChars } from "./textField.js";
import { layoutGlyph } from "./textLayout.js";

function newField(value = "", placeholder = ""): { field: HTMLElement; input: HTMLInputElement } {
  const field = document.createElement("span");
  const input = document.createElement("input");
  input.value = value;
  input.placeholder = placeholder;
  field.appendChild(input);
  document.body.appendChild(field);
  return { field, input };
}

const cellsOf = (field: Element) =>
  Array.from(field.querySelectorAll(".tc-field > span > svg")) as SVGSVGElement[];
const left = (el: Element) => parseFloat((el as HTMLElement).style.left);
const point = (type: string, clientX: number, extra: MouseEventInit = {}) =>
  new MouseEvent(type, { clientX, bubbles: true, cancelable: true, ...extra });

beforeEach(() => {
  document.body.textContent = "";
});
afterEach(() => {
  document.body.textContent = "";
});

describe("fieldChars", () => {
  it("draws one character for each character of the input", () => {
    expect(fieldChars('Он сказал "да" isn\'t')).toEqual(
      ["О", "Н", " ", "С", "К", "А", "З", "А", "Л", " ", "«", "Д", "А", "»", " ", "I", "S", "N", "’", "T"],
    );
  });

  it("leaves an empty box for what the set cannot draw", () => {
    expect(fieldChars("a@b")).toEqual(["A", null, "B"]);
    expect(fieldChars("a\tb")).toEqual(["A", " ", "B"]);
  });
});

describe("createTextField", () => {
  it("draws the value one glyph per character, kerned like Text", () => {
    const { field } = newField("TA@");
    createTextField(field, { size: 24 });
    const cells = cellsOf(field);
    expect(cells).toHaveLength(3);
    expect(cells[2]!.classList.contains("tc-tofu")).toBe(true);
    const t = layoutGlyph(["T", "A"], 0, { size: 24 });
    expect(left(cells[1]!)).toBeCloseTo(Number(t.svgAttrs["width"]), 1);
  });

  it("shows the caret only while focused, at the boundary of the selection", () => {
    const { field, input } = newField("ABC");
    createTextField(field, { size: 24 });
    expect(field.querySelector(".tc-caret")).toBeNull();
    input.setSelectionRange(1, 1);
    input.focus();
    const caret = field.querySelector<HTMLElement>(".tc-caret")!;
    const a = cellsOf(field)[1]!;
    expect(parseFloat(caret.style.left) + strokeOnScreen(24) / 2).toBeCloseTo(left(a), 1);
    input.blur();
    expect(field.querySelector(".tc-caret")).toBeNull();
  });

  it("a selection is a plate from boundary to boundary, and hides the caret", () => {
    const { field, input } = newField("ABC");
    createTextField(field, { size: 24 });
    input.focus();
    field.dispatchEvent(point("pointerdown", 0));
    const cells = cellsOf(field);
    const end = left(cells[2]!);
    field.dispatchEvent(point("pointermove", end + 0.5));
    field.dispatchEvent(point("pointerup", end));
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 2]);
    const plate = field.querySelector<HTMLElement>(".tc-selection")!;
    expect(parseFloat(plate.style.left)).toBeCloseTo(-2, 1);
    expect(parseFloat(plate.style.width)).toBeCloseTo(end + 4, 1);
    expect(field.querySelector(".tc-caret")).toBeNull();
  });

  it("a click lands on the nearest boundary", () => {
    const { field, input } = newField("ABC");
    createTextField(field, { size: 24 });
    const cells = cellsOf(field);
    const middleOfB = (left(cells[1]!) + left(cells[2]!)) / 2;
    field.dispatchEvent(point("pointerdown", middleOfB + 1));
    field.dispatchEvent(point("pointerup", middleOfB + 1));
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(2);
  });

  it("a double click selects the word", () => {
    const { field, input } = newField("как дела");
    createTextField(field, { size: 24 });
    const cells = cellsOf(field);
    field.dispatchEvent(point("dblclick", left(cells[5]!) + 1));
    expect(input.value.slice(input.selectionStart!, input.selectionEnd!)).toBe("дела");
  });

  it("typing redraws the field", () => {
    const { field, input } = newField("AB");
    createTextField(field);
    input.value = "ABC";
    input.dispatchEvent(new Event("input"));
    expect(cellsOf(field)).toHaveLength(3);
  });

  it("refresh draws a value set from code", () => {
    const { field, input } = newField("AB");
    const control = createTextField(field);
    input.value = "A B C";
    control.refresh();
    expect(cellsOf(field)).toHaveLength(3);
  });

  it("draws the placeholder in the same letters while the field is empty", () => {
    const { field } = newField("", "Имя");
    createTextField(field);
    const hint = field.querySelector<HTMLElement>(".tc-placeholder")!;
    expect(hint.style.opacity).toBe("0.4");
    expect(Array.from(hint.querySelectorAll("svg")).map((svg) => svg.getAttribute("data-char")).join("")).toBe("ИМЯ");
  });

  it("destroy removes what it drew and gives the input its look back", () => {
    const { field, input } = newField("AB");
    input.setAttribute("style", "color: red");
    const control = createTextField(field);
    control.destroy();
    expect(field.querySelector(".tc-field")).toBeNull();
    expect(input.getAttribute("style")).toBe("color: red");
  });

  it("an input is required", () => {
    const field = document.createElement("span");
    expect(() => createTextField(field)).toThrow(/input/);
  });
});
