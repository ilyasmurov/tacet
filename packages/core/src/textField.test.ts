// Tests for the text field. jsdom has no layout and no Web Animations: the
// field draws still, every rect is at 0, and that is enough to check what the
// field draws, where the caret and the selection go and where a click lands.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { strokeOnScreen } from "./stroke.js";
import { TEXT_TIMING } from "./text.js";
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

type Loose = Record<string, unknown>;

/** One call of the fake `animate`: on what, which keyframes, with which timing. */
interface Played {
  el: Element;
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
}

/** Stands in for a browser, as in text.test.ts: animations finish on the next tick, a stroke measures 10 units. */
function installMotion(played: Played[]): () => void {
  const element = Element.prototype as unknown as Loose;
  const svg = SVGElement.prototype as unknown as Loose;
  const saved = element["animate"];
  element["animate"] = function fakeAnimate(this: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
    played.push({ el: this, frames, options });
    const listeners: Array<() => void> = [];
    let cancelled = false;
    setTimeout(() => {
      if (!cancelled) for (const fn of listeners) fn();
    }, 0);
    return {
      cancel() { cancelled = true; },
      addEventListener(_type: string, fn: () => void) { listeners.push(fn); },
    };
  };
  svg["getTotalLength"] = () => 10;
  return () => {
    if (saved) element["animate"] = saved;
    else delete element["animate"];
    delete svg["getTotalLength"];
  };
}

describe("transitions", () => {
  const played: Played[] = [];
  let restore: () => void;
  beforeEach(() => {
    played.length = 0;
    restore = installMotion(played);
  });
  afterEach(() => restore());

  const type = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event("input"));
  };
  const delays = (calls: Played[]) => calls.map((call) => Number(call.options.delay));
  const strokesIn = (svgs: Element[]) =>
    played.filter((call) => svgs.some((svg) => svg.contains(call.el)) && call.frames.some((frame) => "strokeDashoffset" in frame));

  it("what went erases where it stands, and only then the tail moves and the new glyphs write in", () => {
    // TACET-65: the tail used to slide at once, over the glyphs still erasing.
    const { field, input } = newField("Привет, мир!");
    createTextField(field);
    const before = cellsOf(field);
    const bang = before[before.length - 1]!;
    type(input, "Привет, свет!");
    const fresh = cellsOf(field).filter((svg) => !before.includes(svg));
    const erasing = strokesIn(before.filter((svg) => svg !== bang));
    const slide = played.find((call) => call.el === bang && call.frames.some((frame) => "left" in frame));

    expect(erasing.length).toBeGreaterThan(0);
    for (const delay of delays(erasing)) expect(delay, "erase").toBe(0);
    expect(slide?.options.delay, "slide").toBe(TEXT_TIMING.erase);
    expect(Math.min(...delays(strokesIn(fresh))), "write").toBe(TEXT_TIMING.erase + TEXT_TIMING.lag);
  });

  it("a glyph typed at the end writes in at once", () => {
    const { field, input } = newField("Приве");
    createTextField(field);
    const before = cellsOf(field);
    type(input, "Привет");
    const fresh = cellsOf(field).filter((svg) => !before.includes(svg));
    expect(fresh).toHaveLength(1);
    expect(Math.min(...delays(strokesIn(fresh)))).toBe(0);
  });
});
