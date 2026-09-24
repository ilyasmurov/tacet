// Tests for the digits field. jsdom has no layout and no Web Animations: the
// field draws still and every rect is at 0 — enough to check what the field
// draws, what it lets into the input and where the caret and a click land. The
// transitions run on fakes that finish every animation on the next tick.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DIGIT_TIMING } from "./digits.js";
import { createDigitsField } from "./digitsField.js";
import { slotSpec } from "./digitsLayout.js";
import { strokeOnScreen } from "./stroke.js";
import { TEXT_TIMING } from "./text.js";

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
/** What the field shows, left to right: a new slot is placed by its left, wherever it sits in the DOM. */
const chars = (field: Element) =>
  cellsOf(field).sort((a, b) => left(a) - left(b)).map((svg) => svg.getAttribute("data-char")).join("");
const point = (type: string, clientX: number, extra: MouseEventInit = {}) =>
  new MouseEvent(type, { clientX, bubbles: true, cancelable: true, ...extra });
/** Types into the input as a browser would: the new value, the caret after what was typed, an input event. */
const type = (input: HTMLInputElement, value: string, caret = value.length) => {
  input.value = value;
  input.setSelectionRange(caret, caret);
  input.dispatchEvent(new Event("input"));
};
const flush = async () => {
  for (let i = 0; i < 8; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

beforeEach(() => {
  document.body.textContent = "";
});
afterEach(() => {
  document.body.textContent = "";
});

describe("createDigitsField", () => {
  it("draws the value one slot per character, the colon narrower", () => {
    const { field } = newField("12:30");
    createDigitsField(field, { size: 32 });
    const digit = Number(slotSpec("1", { size: 32 }).svgAttrs["width"]);
    const colon = Number(slotSpec(":", { size: 32 }).svgAttrs["width"]);
    expect(chars(field)).toBe("12:30");
    const expected = [0, digit, 2 * digit, 2 * digit + colon, 3 * digit + colon];
    cellsOf(field).forEach((cell, i) => expect(left(cell), `slot ${i}`).toBeCloseTo(expected[i]!, 1));
  });

  it("keeps the digits and the colon only, and the caret after what was typed", () => {
    const { field, input } = newField("1234");
    createDigitsField(field);
    input.focus();
    type(input, "12x34", 3);
    expect(input.value).toBe("1234");
    expect(input.selectionStart).toBe(2);
    type(input, "12:34", 3);
    expect(input.value).toBe("12:34");
    expect(chars(field)).toBe("12:34");
  });

  it("a value set from code is cleaned on refresh", () => {
    const { field, input } = newField("");
    const control = createDigitsField(field);
    input.value = "10 : 45";
    control.refresh();
    expect(input.value).toBe("10:45");
    expect(chars(field)).toBe("10:45");
  });

  it("the caret is the text field's: a stroke at the boundary, while focused", () => {
    const { field, input } = newField("123");
    createDigitsField(field, { size: 24 });
    input.setSelectionRange(1, 1);
    input.focus();
    const caret = field.querySelector<HTMLElement>(".tc-caret")!;
    expect(parseFloat(caret.style.left) + strokeOnScreen(24) / 2).toBeCloseTo(left(cellsOf(field)[1]!), 1);
    input.blur();
    expect(field.querySelector(".tc-caret")).toBeNull();
  });

  it("a selection is a plate from boundary to boundary of the slots", () => {
    const { field, input } = newField("12:30");
    const control = createDigitsField(field, { size: 24 });
    input.focus();
    input.setSelectionRange(3, 5);
    control.refresh();
    const cells = cellsOf(field);
    const start = left(cells[3]!);
    const end = left(cells[4]!) + Number(slotSpec("0", { size: 24 }).svgAttrs["width"]);
    const plate = field.querySelector<HTMLElement>(".tc-selection")!;
    expect(parseFloat(plate.style.left)).toBeCloseTo(start - 2, 1);
    expect(parseFloat(plate.style.width)).toBeCloseTo(end - start + 4, 1);
    expect(field.querySelector(".tc-caret")).toBeNull();
  });

  it("a click lands on the nearest boundary", () => {
    const { field, input } = newField("123");
    createDigitsField(field);
    const cells = cellsOf(field);
    const middleOfTwo = (left(cells[1]!) + left(cells[2]!)) / 2;
    field.dispatchEvent(point("pointerdown", middleOfTwo + 1));
    field.dispatchEvent(point("pointerup", middleOfTwo + 1));
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 2]);
  });

  it("a double click takes the group between two colons", () => {
    const { field, input } = newField("12:30:45");
    createDigitsField(field);
    field.dispatchEvent(point("dblclick", left(cellsOf(field)[4]!) + 1));
    expect(input.value.slice(input.selectionStart!, input.selectionEnd!)).toBe("30");
  });

  it("draws the digits of the placeholder, and nothing else of it", () => {
    const { field } = newField("", "00:00");
    createDigitsField(field);
    const hint = field.querySelector(".tc-placeholder")!;
    expect(Array.from(hint.querySelectorAll("svg")).map((svg) => svg.getAttribute("data-char")).join("")).toBe("00:00");

    const words = newField("", "Количество");
    createDigitsField(words.field);
    expect(words.field.querySelector(".tc-placeholder")).toBeNull();
  });

  it("an input is required", () => {
    expect(() => createDigitsField(document.createElement("span"))).toThrow(/createDigitsField/);
  });
});

type Loose = Record<string, unknown>;

/** One call of the fake `animate`: on what, which keyframes, with which timing. */
interface Played {
  el: Element;
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
}

/**
 * Stands in for a browser, as in digits.test.ts: animations finish on the next
 * tick, a frame arrives long after any duration, a contour measures as a
 * straight line. Every call of `animate` lands in `played`.
 */
function installMotion(played: Played[]): () => void {
  const element = Element.prototype as unknown as Loose;
  const svg = SVGElement.prototype as unknown as Loose;
  const saved = { animate: element["animate"], raf: globalThis.requestAnimationFrame, caf: globalThis.cancelAnimationFrame };
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
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now() + 60_000), 0)) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as typeof cancelAnimationFrame;
  svg["getTotalLength"] = () => 100;
  svg["getPointAtLength"] = (at: number) => ({ x: at / 10, y: 12 });
  return () => {
    if (saved.animate) element["animate"] = saved.animate;
    else delete element["animate"];
    globalThis.requestAnimationFrame = saved.raf;
    globalThis.cancelAnimationFrame = saved.caf;
    delete svg["getTotalLength"];
    delete svg["getPointAtLength"];
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

  const on = (el: Element, key: string) => played.filter((call) => el.contains(call.el) && call.frames.some((frame) => key in frame));
  const delays = (calls: Played[]) => calls.map((call) => Number(call.options.delay));

  it("a digit that gives way to a digit turns into it where it stands", async () => {
    const { field, input } = newField("19");
    createDigitsField(field);
    const before = cellsOf(field);
    type(input, "20");
    expect(cellsOf(field)).toEqual(before);
    await flush();
    expect(chars(field)).toBe("20");
    expect(field.querySelector("mask")).toBeNull();
  });

  it("what went erases where it stands, and only then the tail moves", async () => {
    // "12345", "34" selected, "0" typed: the 3 turns into the 0, the 4 erases, the 5 waits for it.
    const { field, input } = newField("12345");
    createDigitsField(field);
    const [, , three, four, five] = cellsOf(field);
    type(input, "1205", 3);
    expect(three!.getAttribute("data-char")).toBe("0");
    expect(on(four!, "strokeDashoffset").length).toBeGreaterThan(0);
    for (const delay of delays(on(four!, "strokeDashoffset"))) expect(delay, "erase").toBe(0);
    expect(delays(on(five!, "left")), "slide").toEqual([DIGIT_TIMING.vanish]);
    await flush();
    expect(chars(field)).toBe("1205");
  });

  it("a new digit draws itself in once the gone one is erased", async () => {
    // A digit cannot turn into the colon: the colon fades, the 8 waits for it.
    const { field, input } = newField("12:34");
    createDigitsField(field);
    const before = cellsOf(field);
    const colon = before[2]!;
    type(input, "12834", 3);
    const eight = cellsOf(field).find((svg) => !before.includes(svg))!;
    expect(delays(on(colon, "opacity")), "fade").toEqual([0]);
    expect(Math.min(...delays(on(eight, "strokeDashoffset"))), "draw").toBe(DIGIT_TIMING.vanish + TEXT_TIMING.lag);
    expect(delays(on(before[3]!, "left")), "slide").toEqual([DIGIT_TIMING.vanish]);
    await flush();
    expect(chars(field)).toBe("12834");
    expect(field.querySelector("mask")).toBeNull();
  });
});
