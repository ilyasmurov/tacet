# Tacet digits field — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A field for numbers drawn in the Tacet digits, with the caret and the selection of the letters' text field — one field control with two layouts, text and digits: `createDigitsField` in the core, `DigitsField` in React, `<tacet-digits-field>` as a custom element. The quantity field on tacet.smurov.com becomes one. Release 0.4.0.

**Architecture:** The caret, the selection, the pointer, the hidden input and the order of a change move out of `textField.ts` into `field.ts`, a field that draws whatever its *kind* lays out. The text field is that field with the letters of Text; the digits field is the same field with the digit slots of Digits, and its input keeps the digits and the colon only. A change keeps the common head and tail; what went erases where it stands, then the tail slides, then the new glyphs come — the order TACET-63 settled for a line — and a digit that gives way to a digit turns into it where it stands, the way Digits does. React and the custom elements get one shared base each (`useField`, `TacetFieldElement`) and stay thin.

**Tech Stack:** TypeScript (strict, `exactOptionalPropertyTypes`, NodeNext ESM), Web Animations API, `requestAnimationFrame` for the digit morph, SVG masks, vitest + jsdom, React 19 (`react-dom/server`, `react-dom/client`), custom elements, a static site built by `site/build.ts`.

**Spec:** Taskless document «Поле ввода цифр в Tacet — дизайн», https://taskless.ru/app/smurov/docs/cmufhntny1f402xrzxl2k3iad, attached to the epic TACET-64. The code below was written and checked first, one commit per task on the branches `tacet-65-field-core` … `tacet-70-docs`, each branch on top of the one before, on 24.09.2026; every block below is taken from those commits. Each commit passed build, typecheck and the full suite on its own (284 tests at the end). Each task's new tests were run on the code before the task and failed as its «watch it fail» step says. The fields were checked in headless Chromium: frame-by-frame captures of the transitions, and the site's digits section at 1280 and 375 px.

## Global Constraints

- Everything in the repository is in English: code comments, commit messages, README files, site texts. Only tracker tasks are in Russian.
- Every commit message starts with the task slug: `TACET-65: …`.
- One task = one branch named after the slug (`tacet-65-field-core`) = one PR. The first line of the PR description is the task URL, `https://taskless.ru/app/smurov/tasks/TACET-65`. Branch from `main` after the tasks this one depends on are merged.
- Relative imports inside `packages/*/src` carry the `.js` extension (NodeNext ESM): `import { createField } from "./field.js"`.
- `tacet-core` has no dependencies and gets none. No new dependencies anywhere.
- The wrappers import `tacet-core` from `packages/core/dist`, and the element's parity test imports `tacet-react` from `packages/react/dist`. After a change in the core run `pnpm build` before testing react or element.
- The site deploy is `pnpm run deploy`. Plain `pnpm deploy` is a pnpm built-in and fails with `ERR_PNPM_NOTHING_TO_DEPLOY`.
- Pushing tags and deploying happen only on Ilya's word.
- Ilya took these decisions on 24.09.2026; they change only with his word: one field control with two layouts, text and digits, not a separate component; the digits field holds the digits and the colon only; its caret and selection are the text field's — an accent stroke as thick as the glyphs' stroke, and a plate of the accent at 20 %; the quantity field on the site becomes `<tacet-digits-field>`; the release is 0.4.0.
- The order of a change in any field: what went erases where it stands (text `TEXT_TIMING.erase`, 220 ms; digits `DIGIT_TIMING.vanish`, 300 ms), then the kept tail slides over `TEXT_TIMING.slide` (320 ms), and the new glyphs come `TEXT_TIMING.lag` (200 ms) after the erase. With nothing erased, the new glyphs come at once.
- A digit turns into a digit by the field's `transition` — `morph` (default), `relay` or `erase` — with the timings of `DIGIT_TIMING`. The colon never turns: it fades out and in like a dot, over `TEXT_TIMING.dot` (160 ms).
- A cleaned value is written through the `HTMLInputElement.prototype` value setter, never `input.value = …`: a framework that watches the property must see the change.

## File map

| File | Task | What it holds |
| --- | --- | --- |
| `packages/core/src/field.ts` (new) | 1, 2, 3 | the field: input, caret, selection, pointer, placeholder, the order of a change; `turn`; the value writer |
| `packages/core/src/textField.ts`, `textField.test.ts` | 1 | the text kind, `createTextField`; the order tests |
| `packages/core/src/digits.ts` | 2 | slot functions exported for the field; `morph` resolves when it lands; `eraseStrokes` |
| `packages/core/src/digitsLayout.ts` | 2 | `keepDigits` |
| `packages/core/src/digitsField.ts` (new), `digitsField.test.ts` (new) | 2 | the digits kind, `createDigitsField` |
| `packages/core/src/index.ts` | 2 | exports |
| `packages/react/src/field.tsx` (new) | 3 | `FieldProps`, `useField` |
| `packages/react/src/TextField.tsx`, `DigitsField.tsx` (new), `DigitsField.test.tsx` (new), `index.ts` | 3 | React |
| `packages/element/src/TacetFieldElement.ts` (new), `TacetTextFieldElement.ts`, `TacetDigitsFieldElement.ts` (new), `index.ts`, `parity.test.ts` | 4 | custom elements and parity |
| `site/build.ts`, `site/styles.css` | 5 | the quantity card |
| `README.md`, `packages/core/README.md`, `packages/react/README.md`, `packages/element/README.md` | 6 | documentation |
| `packages/*/package.json` | 7 | version 0.4.0 |

## Order

| Task | Slug | Depends on |
| --- | --- | --- |
| 1. One field control under the text field | TACET-65 | — |
| 2. `createDigitsField` | TACET-66 | 1 |
| 3. `DigitsField` for React | TACET-67 | 2 |
| 4. `<tacet-digits-field>` and parity | TACET-68 | 3 |
| 5. The quantity field on the site | TACET-69 | 4 |
| 6. Documentation | TACET-70 | 4 |
| 7. Release 0.4.0 | TACET-71 | all |

Tasks 1–4 form a chain: 2 and 3 both change `field.ts`, and the element's parity test needs the React `DigitsField`. Tasks 5 and 6 can run in parallel after 4. The test totals in the «Full check» steps assume the listed order.

---

### Task 1: One field control under the text field (TACET-65)

The text field's machinery — the invisible input, the stage of absolutely placed cells, the caret and the selection, the pointer, the placeholder and the diff of a change — moves out of `textField.ts` into `field.ts` as `createField(field, opts, kind, name)`. What differs between fields is a *kind* (`FieldKind`): which characters the input may hold (`clean`), how a value is laid out (`layout` → keys, advances, `draw`, `refit`), what ends a word for a double click (`isBreak`), which part of a change is kept (`mode`), how a glyph leaves and comes, and how a drawing is left still. `textField.ts` becomes the text kind plus `createTextField`; `fieldChars`, `CARET_TIMING` and `TextFieldController` keep their exports.

The field also owns the order of a change. The text field used to slide the kept tail at once, over the glyphs still erasing: «Привет, мир!» → «Привет!» piled «!» onto «МИР». Now it is the order TACET-63 settled for a line: what went erases where it stands; after `kind.leaveTime` the tail slides; the new glyphs come `TEXT_TIMING.lag` after that. A glyph typed with nothing erased writes in at once. An empty box — a character the set cannot draw — fades out and in rather than standing still while the tail waits.

The twelve existing tests of `textField.test.ts` do not change. Two new ones read the choreography from a fake `animate`, as `text.test.ts` does.

**Files:**
- Create: `packages/core/src/field.ts`
- Modify: `packages/core/src/textField.test.ts`, `packages/core/src/textField.ts`

**Interfaces:**
- Consumes: `TEXT_TIMING`, `canAnimate`, `run`, `eraseOut`, `writeIn`, `fromMarkup` and `Flight` from `text.ts`; `layoutGlyph`, `glyphMarkup`, `SPACE_ADVANCE` and `TextGlyph` from `textLayout.ts`; `strokeOnScreen`, `normalizeSize`, `insetFor` and `StrokeOpts` from `stroke.ts` — all unchanged.
- Produces: in `field.ts`, internal (`index.ts` does not export it): `createField<O extends FieldOptions>(field: HTMLElement, opts: O, kind: FieldKind<O>, name: string): FieldController<O>`, the interfaces `FieldKind<O>`, `FieldLayout`, `FieldMetrics`, `FieldOptions`, `FieldController<O>`, and `CARET_TIMING`. `textField.ts` re-exports `CARET_TIMING`; `TextFieldController` is now `FieldController<TextOptions>`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull
git switch -c tacet-65-field-core
```

- [ ] **Step 2: Write the failing test**

Apply this change to `packages/core/src/textField.test.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/core/src/textField.test.ts b/packages/core/src/textField.test.ts
index 4615285..8f5b373 100644
--- a/packages/core/src/textField.test.ts
+++ b/packages/core/src/textField.test.ts
@@ -4,6 +4,7 @@
 
 import { afterEach, beforeEach, describe, expect, it } from "vitest";
 import { strokeOnScreen } from "./stroke.js";
+import { TEXT_TIMING } from "./text.js";
 import { createTextField, fieldChars } from "./textField.js";
 import { layoutGlyph } from "./textLayout.js";
 
@@ -140,3 +141,82 @@ describe("createTextField", () => {
     expect(() => createTextField(field)).toThrow(/input/);
   });
 });
+
+type Loose = Record<string, unknown>;
+
+/** One call of the fake `animate`: on what, which keyframes, with which timing. */
+interface Played {
+  el: Element;
+  frames: Keyframe[];
+  options: KeyframeAnimationOptions;
+}
+
+/** Stands in for a browser, as in text.test.ts: animations finish on the next tick, a stroke measures 10 units. */
+function installMotion(played: Played[]): () => void {
+  const element = Element.prototype as unknown as Loose;
+  const svg = SVGElement.prototype as unknown as Loose;
+  const saved = element["animate"];
+  element["animate"] = function fakeAnimate(this: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
+    played.push({ el: this, frames, options });
+    const listeners: Array<() => void> = [];
+    let cancelled = false;
+    setTimeout(() => {
+      if (!cancelled) for (const fn of listeners) fn();
+    }, 0);
+    return {
+      cancel() { cancelled = true; },
+      addEventListener(_type: string, fn: () => void) { listeners.push(fn); },
+    };
+  };
+  svg["getTotalLength"] = () => 10;
+  return () => {
+    if (saved) element["animate"] = saved;
+    else delete element["animate"];
+    delete svg["getTotalLength"];
+  };
+}
+
+describe("transitions", () => {
+  const played: Played[] = [];
+  let restore: () => void;
+  beforeEach(() => {
+    played.length = 0;
+    restore = installMotion(played);
+  });
+  afterEach(() => restore());
+
+  const type = (input: HTMLInputElement, value: string) => {
+    input.value = value;
+    input.dispatchEvent(new Event("input"));
+  };
+  const delays = (calls: Played[]) => calls.map((call) => Number(call.options.delay));
+  const strokesIn = (svgs: Element[]) =>
+    played.filter((call) => svgs.some((svg) => svg.contains(call.el)) && call.frames.some((frame) => "strokeDashoffset" in frame));
+
+  it("what went erases where it stands, and only then the tail moves and the new glyphs write in", () => {
+    // TACET-65: the tail used to slide at once, over the glyphs still erasing.
+    const { field, input } = newField("Привет, мир!");
+    createTextField(field);
+    const before = cellsOf(field);
+    const bang = before[before.length - 1]!;
+    type(input, "Привет, свет!");
+    const fresh = cellsOf(field).filter((svg) => !before.includes(svg));
+    const erasing = strokesIn(before.filter((svg) => svg !== bang));
+    const slide = played.find((call) => call.el === bang && call.frames.some((frame) => "left" in frame));
+
+    expect(erasing.length).toBeGreaterThan(0);
+    for (const delay of delays(erasing)) expect(delay, "erase").toBe(0);
+    expect(slide?.options.delay, "slide").toBe(TEXT_TIMING.erase);
+    expect(Math.min(...delays(strokesIn(fresh))), "write").toBe(TEXT_TIMING.erase + TEXT_TIMING.lag);
+  });
+
+  it("a glyph typed at the end writes in at once", () => {
+    const { field, input } = newField("Приве");
+    createTextField(field);
+    const before = cellsOf(field);
+    type(input, "Привет");
+    const fresh = cellsOf(field).filter((svg) => !before.includes(svg));
+    expect(fresh).toHaveLength(1);
+    expect(Math.min(...delays(strokesIn(fresh)))).toBe(0);
+  });
+});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx vitest run packages/core/src/textField.test.ts`
Expected: FAIL — `Tests  1 failed | 13 passed (14)`, with `AssertionError: slide: expected +0 to be 220`.

- [ ] **Step 4: Implement**

Create `packages/core/src/field.ts`:

```ts
// The field: a real <input> inside, and over it glyphs, a caret and a
// selection of our own. The text field and the digits field are both built on
// it; only what they draw differs (TACET-64).
//
// The input is invisible but keeps the focus. The caret, the selection with
// Shift and the arrows, copy, paste, undo, input methods and autofill are the
// input's own, and so is its place in a form. What the field draws comes from
// its kind, never from the input's font, so it cannot drift away from the
// glyphs. A click lands on the nearest boundary between glyphs.
//
// One character of the input is one cell of the field: the caret index in the
// input is the index in the layout. The kind says which characters the input
// may hold, how wide each one is and how it is drawn, and how a glyph comes
// and goes. The order of a change belongs to the field and is the same for
// every kind: what went erases where it stands, then the tail moves, then the
// new glyphs come — the order TACET-63 settled for a line.
//
// Chosen on the demo of 24.09.2026: the caret is a stroke in the accent colour,
// as thick as the glyphs; the selection is a plate of the accent at 20%.

import { ACCENT_VAR } from "./renderSpec.js";
import { insetFor, normalizeSize, strokeOnScreen, type StrokeOpts } from "./stroke.js";
import { TEXT_TIMING, canAnimate, run, type Flight } from "./text.js";

/** A field that draws its input's value. */
export interface FieldController<O> {
  /** Draw the input's value again — after setting `input.value` from code. */
  refresh(): void;
  /** New options. Anything that changes the drawing redraws the field at once. */
  update(opts: O): void;
  /** Stop listening, remove what the field drew, give the input its own look back. */
  destroy(): void;
}

/** Timings of the caret, ms: a soft pulse, still while typing and for a moment after. */
export const CARET_TIMING = { pulse: 1200, rest: 500 } as const;

/** What every field reads from its options, whatever it draws. */
export interface FieldOptions extends StrokeOpts {
  size?: number | undefined;
  accentColor?: string | undefined;
}

/** Sizes of the moment, in pixels. */
export interface FieldMetrics {
  size: number;
  /** Pixels in one glyph unit. */
  unit: number;
  /** Where the capitals start and end, from the top of the field's line. */
  capTop: number;
  capBottom: number;
}

/** A value laid out: for each character its key and advance, and how to draw it still. */
export interface FieldLayout {
  /** One per character of the value; equal keys mean the same drawing. */
  keys: string[];
  /** Advances, in pixels. */
  ws: number[];
  /** Draws character i still; null when there is nothing to draw, like a space. */
  draw(i: number): SVGSVGElement | null;
  /** A kept drawing takes what its new neighbours give it — the kerning of letters. */
  refit(el: SVGSVGElement, i: number): void;
}

/** What a field draws: letters or digits. Everything else is the field's own. */
export interface FieldKind<O extends FieldOptions> {
  /** The value the input may hold. What falls outside it is taken out of the input as it is typed. */
  clean(value: string): string;
  layout(value: string, opts: O, metrics: FieldMetrics): FieldLayout;
  /** Whether a character ends a word, for a double click. */
  isBreak(char: string): boolean;
  /** Keep the common head and tail, keep nothing ("rewrite"), or drop what went at once ("append"). */
  mode(opts: O): "keep" | "rewrite" | "append";
  /** How long a gone glyph takes to erase: the tail and the new glyphs wait for it. */
  leaveTime: number;
  /** Erases a glyph where it stands. */
  leave(flight: Flight, el: SVGSVGElement, opts: O): Promise<unknown>;
  /** Brings a new glyph in, starting after `delay`. */
  enter(flight: Flight, el: SVGSVGElement, delay: number, opts: O): Promise<unknown>;
  /** Leaves a drawing still, whatever runs on it. */
  still(el: SVGSVGElement, opts: O): void;
}

/** One character of the field as laid out, in pixels. */
interface Cell {
  key: string;
  el: SVGSVGElement | null;
  x: number;
  w: number;
}

const px = (n: number) => `${Math.round(n * 100) / 100}px`;
const EASE_SLIDE = "cubic-bezier(.3,.7,.2,1)";

/**
 * Takes over `field` — an element with an `<input>` inside — and draws the
 * input's value with the glyphs of `kind`, with a caret and a selection of its
 * own. `name` goes into the error when there is no input.
 */
export function createField<O extends FieldOptions>(field: HTMLElement, opts: O, kind: FieldKind<O>, name: string): FieldController<O> {
  const input = field.querySelector("input");
  if (!input) throw new Error(`tacet: ${name} needs an <input> inside the field`);
  let options: O = { ...opts };
  const savedInputStyle = input.getAttribute("style");

  // The field's own look is left to its stylesheet; these only fill what is missing.
  const own = (key: string, value: string) => {
    if (!field.style.getPropertyValue(key)) field.style.setProperty(key, value);
  };
  own("position", getComputedStyle(field).position === "static" ? "relative" : field.style.position);
  own("display", "inline-block");
  own("overflow", "hidden");
  own("cursor", "text");
  own("user-select", "none");
  own("-webkit-user-select", "none");
  own("touch-action", "pan-y");
  Object.assign(input.style, {
    position: "absolute", inset: "0", width: "100%", height: "100%", margin: "0", padding: "0", border: "0",
    opacity: "0", pointerEvents: "none", fontSize: "16px", background: "transparent", caretColor: "transparent",
  });

  const layer = document.createElement("span");
  layer.className = "tc-field";
  layer.setAttribute("aria-hidden", "true");
  const stage = document.createElement("span");
  layer.appendChild(stage);
  field.insertBefore(layer, input);

  let cells: Cell[] = [];
  let drawn = "";
  let scroll = 0;
  let caret: HTMLSpanElement | null = null;
  let pulse: Animation | null = null;
  let plate: HTMLSpanElement | null = null;
  let frame = 0;
  let marksFor = "";
  const flights = new Set<Flight>();

  /** Sizes of the moment: size, the zoom of the glyph window and where the capitals sit in it. */
  const geometry = (): FieldMetrics & { pad: number } => {
    const size = normalizeSize(options.size ?? 24);
    const inset = insetFor(size);
    const unit = size / (24 - 2 * inset);
    return { size, unit, capTop: (4 - inset) * unit, capBottom: (20 - inset) * unit, pad: Math.round(size * 0.35) };
  };

  const placeLayer = () => {
    const { size, pad } = geometry();
    layer.setAttribute("style", `position:absolute;left:${pad}px;right:${pad}px;top:50%;height:${size}px;margin-top:${-size / 2}px;pointer-events:none`);
    stage.setAttribute("style", `position:absolute;left:0;top:0;height:${size}px;color:inherit;transform:translateX(${-scroll}px)`);
    if (!field.style.minHeight) field.style.minHeight = px(size * 1.6);
    if (!field.style.minWidth) field.style.minWidth = px(size * 6);
  };

  /** The layout of the value, one cell per character of the input, with the x of each. */
  const layout = (value: string) => {
    const laid = kind.layout(value, options, geometry());
    const xs: number[] = [];
    let x = 0;
    for (const w of laid.ws) {
      xs.push(x);
      x += w;
    }
    return { ...laid, xs };
  };

  const place = (el: Element, x: number) => {
    (el as SVGSVGElement).style.position = "absolute";
    (el as SVGSVGElement).style.left = px(x);
    (el as SVGSVGElement).style.top = "0";
  };

  const settle = () => {
    for (const flight of flights) {
      for (const animation of flight.animations) animation.cancel();
      flight.finish();
    }
    flights.clear();
  };

  /** Draws `value` still: no animation, the exact glyphs. */
  const redraw = (value: string) => {
    settle();
    stage.replaceChildren();
    caret = null;
    plate = null;
    const laid = layout(value);
    cells = laid.keys.map((key, i) => {
      const el = laid.draw(i);
      if (el) {
        place(el, laid.xs[i]!);
        stage.appendChild(el);
      }
      return { key, el, x: laid.xs[i]!, w: laid.ws[i]! };
    });
    drawn = value;
    placeholder();
    marksFor = "";
    paintMarks();
  };

  /** The placeholder, drawn in the same glyphs at 40%, while the field is empty. */
  const placeholder = () => {
    stage.querySelector(".tc-placeholder")?.remove();
    const text = input.value ? "" : kind.clean(input.placeholder);
    if (!text) return;
    const laid = layout(text);
    const hint = document.createElement("span");
    hint.className = "tc-placeholder";
    hint.setAttribute("style", "position:absolute;left:0;top:0;opacity:.4");
    laid.keys.forEach((_, i) => {
      const el = laid.draw(i);
      if (!el || el.classList.contains("tc-tofu")) return;
      place(el, laid.xs[i]!);
      hint.appendChild(el);
    });
    stage.insertBefore(hint, stage.firstChild);
  };

  /** Draws `value` with the transition: the common head and tail stay, what went erases, then the rest moves and comes. */
  const change = (value: string) => {
    if (!canAnimate()) {
      redraw(value);
      return;
    }
    settle();
    const laid = layout(value);
    const { keys, xs, ws } = laid;
    const old = cells;
    const mode = kind.mode(options);
    let head = 0;
    let tail = 0;
    if (mode !== "rewrite") {
      while (head < old.length && head < keys.length && old[head]!.key === keys[head]) head++;
      while (tail < old.length - head && tail < keys.length - head && old[old.length - 1 - tail]!.key === keys[keys.length - 1 - tail]) tail++;
    }
    const gone = old.slice(head, old.length - tail);

    const flight: Flight = { animations: [], finish: () => {} };
    const cleanups: Array<() => void> = [];
    flight.finish = () => {
      for (const cleanup of cleanups.splice(0)) cleanup();
      flights.delete(flight);
    };
    flights.add(flight);
    const landing: Promise<unknown>[] = [];

    // What went erases where it stands; the tail and the new glyphs wait for it.
    const leaving = gone.filter((cell) => cell.el);
    const erased = mode !== "append" && leaving.length ? kind.leaveTime : 0;
    for (const cell of leaving) {
      const el = cell.el!;
      if (mode === "append") el.remove();
      else {
        landing.push(kind.leave(flight, el, options));
        cleanups.push(() => el.remove());
      }
    }

    const slide = (el: SVGSVGElement, from: number, to: number) => {
      place(el, to);
      if (mode === "append" || from === to) return;
      landing.push(run(flight, el, [{ left: px(from) }, { left: px(to) }], TEXT_TIMING.slide, erased, EASE_SLIDE));
    };

    const fresh: SVGSVGElement[] = [];
    cells = keys.map((key, i) => {
      const kept = i < head ? old[i] : i >= keys.length - tail ? old[old.length - (keys.length - i)] : undefined;
      if (kept) {
        if (kept.el) {
          laid.refit(kept.el, i);
          slide(kept.el, kept.x, xs[i]!);
        }
        return { key, el: kept.el, x: xs[i]!, w: ws[i]! };
      }
      const el = laid.draw(i);
      if (el) {
        place(el, xs[i]!);
        stage.appendChild(el);
        fresh.push(el);
      }
      return { key, el, x: xs[i]!, w: ws[i]! };
    });

    // The new glyphs come once the gone ones are erased and the tail has started out of their way.
    const delay = erased ? erased + TEXT_TIMING.lag : 0;
    for (const el of fresh) {
      landing.push(kind.enter(flight, el, delay, options));
      cleanups.push(() => kind.still(el, options));
    }

    drawn = value;
    placeholder();
    void Promise.all(landing).then(() => {
      if (!flights.has(flight)) return;
      for (const animation of flight.animations) animation.cancel();
      flight.finish();
    });
  };

  /** x of the boundary before cell k, in stage pixels. */
  const edge = (k: number) => {
    if (k < cells.length) return cells[k]!.x;
    const last = cells[cells.length - 1];
    return last ? last.x + last.w : 0;
  };

  const indexAt = (clientX: number) => {
    const x = clientX - stage.getBoundingClientRect().left;
    let best = 0;
    let dist = Infinity;
    for (let k = 0; k <= cells.length; k++) {
      const d = Math.abs(edge(k) - x);
      if (d < dist) { dist = d; best = k; }
    }
    return best;
  };

  const keepVisible = (x: number) => {
    const room = Math.max(0, layer.clientWidth - 2);
    if (x - scroll > room) scroll = x - room;
    if (x - scroll < 0) scroll = Math.max(0, x);
    stage.style.transform = `translateX(${-scroll}px)`;
  };

  /** The caret and the selection, from the layout; repainted only when something they depend on moved. */
  const paintMarks = () => {
    const focused = document.activeElement === input;
    const a = input.selectionStart ?? 0;
    const b = input.selectionEnd ?? 0;
    const signature = `${focused}|${a}|${b}|${drawn}|${cells.length}`;
    if (signature === marksFor) return;
    marksFor = signature;
    const { size, capTop, capBottom } = geometry();
    const accent = options.accentColor ?? ACCENT_VAR;
    plate?.remove();
    plate = null;
    if (!focused) {
      caret?.remove();
      caret = null;
      pulse = null;
      return;
    }
    if (a !== b) {
      caret?.remove();
      caret = null;
      pulse = null;
      const x0 = edge(a);
      const x1 = edge(b);
      plate = document.createElement("span");
      plate.className = "tc-selection";
      const pad = size * 0.12;
      plate.setAttribute("style", `position:absolute;left:${px(x0 - 2)};width:${px(x1 - x0 + 4)};top:${px(capTop - pad)};height:${px(capBottom - capTop + 2 * pad)};border-radius:${px(size * 0.14)};background:${accent};opacity:.2`);
      stage.insertBefore(plate, stage.firstChild);
      keepVisible(input.selectionDirection === "backward" ? x0 : x1);
      return;
    }
    const x = edge(a);
    const stroke = strokeOnScreen(size, options);
    if (!caret) {
      caret = document.createElement("span");
      caret.className = "tc-caret";
      stage.appendChild(caret);
    }
    const over = size * 0.06;
    caret.setAttribute("style", `position:absolute;left:${px(x - stroke / 2)};width:${px(stroke)};top:${px(capTop - over)};height:${px(capBottom - capTop + 2 * over)};border-radius:${px(stroke)};background:${accent}`);
    // Still while it moves; the pulse comes back after a moment of rest.
    pulse?.cancel();
    pulse = typeof caret.animate === "function"
      ? caret.animate([{ opacity: 1 }, { opacity: 0.12 }, { opacity: 1 }], {
        duration: CARET_TIMING.pulse, delay: CARET_TIMING.rest, iterations: Infinity, easing: "ease-in-out",
      })
      : null;
    keepVisible(x);
  };

  // The input moves its own selection on keys; the marks follow it frame by frame while it has the focus.
  const nextFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : null;
  const follow = () => {
    frame = 0;
    if (document.activeElement !== input || !nextFrame) return;
    paintMarks();
    frame = nextFrame(follow);
  };

  // The pointer lands where the layout says, never where the input's font would.
  let anchor = 0;
  let dragging = false;
  const select = (from: number, to: number) => {
    input.setSelectionRange(Math.min(from, to), Math.max(from, to), to < from ? "backward" : "forward");
    paintMarks();
  };
  const onDown = (event: PointerEvent) => {
    if (input.disabled) return;
    event.preventDefault();
    input.focus({ preventScroll: true });
    const i = indexAt(event.clientX);
    if (event.shiftKey) anchor = input.selectionDirection === "backward" ? input.selectionEnd ?? i : input.selectionStart ?? i;
    else anchor = i;
    select(anchor, i);
    dragging = true;
    try {
      field.setPointerCapture?.(event.pointerId);
    } catch {
      // Not every environment tracks pointers; a drag then just ends at the edge.
    }
  };
  const onMove = (event: PointerEvent) => {
    if (dragging) select(anchor, indexAt(event.clientX));
  };
  const onUp = () => {
    dragging = false;
  };
  const onDouble = (event: MouseEvent) => {
    const i = indexAt(event.clientX);
    const v = input.value;
    let a = i;
    let b = i;
    while (a > 0 && !kind.isBreak(v[a - 1]!)) a--;
    while (b < v.length && !kind.isBreak(v[b]!)) b++;
    select(a, b);
  };
  const onClick = (event: MouseEvent) => {
    if (event.detail === 3) select(0, input.value.length);
  };
  /** Takes out of the input what the field does not hold; the caret stays among what is left. */
  const cleanInput = () => {
    const raw = input.value;
    const value = kind.clean(raw);
    if (value === raw) return value;
    const at = kind.clean(raw.slice(0, input.selectionStart ?? raw.length)).length;
    input.value = value;
    if (document.activeElement === input) input.setSelectionRange(at, at);
    return value;
  };
  const onInput = () => change(cleanInput());
  const onFocus = () => {
    field.setAttribute("data-focused", "");
    marksFor = "";
    paintMarks();
    if (!frame && nextFrame) frame = nextFrame(follow);
  };
  const onBlur = () => {
    field.removeAttribute("data-focused");
    marksFor = "";
    paintMarks();
  };

  field.addEventListener("pointerdown", onDown);
  field.addEventListener("pointermove", onMove);
  field.addEventListener("pointerup", onUp);
  field.addEventListener("dblclick", onDouble);
  field.addEventListener("click", onClick);
  input.addEventListener("input", onInput);
  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);

  placeLayer();
  redraw(cleanInput());

  return {
    refresh() {
      const value = cleanInput();
      if (value !== drawn) change(value);
      else paintMarks();
    },
    update(next) {
      options = { ...options, ...next };
      placeLayer();
      redraw(cleanInput());
    },
    destroy() {
      settle();
      if (frame && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
      field.removeEventListener("pointerdown", onDown);
      field.removeEventListener("pointermove", onMove);
      field.removeEventListener("pointerup", onUp);
      field.removeEventListener("dblclick", onDouble);
      field.removeEventListener("click", onClick);
      input.removeEventListener("input", onInput);
      input.removeEventListener("focus", onFocus);
      input.removeEventListener("blur", onBlur);
      layer.remove();
      if (savedInputStyle == null) input.removeAttribute("style");
      else input.setAttribute("style", savedInputStyle);
    },
  };
}
```

Apply this change to `packages/core/src/textField.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/core/src/textField.ts b/packages/core/src/textField.ts
index 452a7d9..c479512 100644
--- a/packages/core/src/textField.ts
+++ b/packages/core/src/textField.ts
@@ -1,42 +1,27 @@
-// A text field that draws what is typed in the Tacet capitals.
+// A text field that draws what is typed in the Tacet capitals — the field of
+// field.ts with the letters of Text.
 //
-// The field holds a real <input>: invisible, but it has the focus. The caret,
-// the selection with Shift and the arrows, copy, paste, undo, input methods and
-// autofill are the input's own, and so is its place in a form. What the field
-// draws — the letters, the caret, the selection — comes from the Text layout,
-// never from the input's font, so it cannot drift away from the letters. A
-// click lands on the nearest boundary between glyphs, kerning included.
-//
-// One character of the input is one glyph of the field: the caret index in the
-// input is the index in the layout. So the replacements are one to one — a
-// straight quote becomes a guillemet by where it stands, an apostrophe the
-// typographic one, any whitespace a space — and a character the set has no
-// glyph for is drawn as an empty box, so it can be seen and stepped over.
-//
-// Chosen on the demo of 24.09.2026: the caret is a stroke in the accent colour,
-// as thick as the letters; the selection is a plate of the accent at 20%.
-
-import { ACCENT_VAR } from "./renderSpec.js";
-import { insetFor, normalizeSize, strokeOnScreen } from "./stroke.js";
+// One character of the input is one glyph of the field, so the replacements are
+// one to one: a straight quote becomes a guillemet by where it stands, an
+// apostrophe the typographic one, any whitespace a space — and a character the
+// set has no glyph for is drawn as an empty box, so it can be seen and stepped
+// over. Within a run of glyphs the letters are kerned as in a word of Text, and
+// a click lands on the nearest boundary, kerning included.
+
+import { createField, type FieldController, type FieldKind, type FieldMetrics } from "./field.js";
+import { strokeOnScreen } from "./stroke.js";
 import { glyphForChar } from "./textChars.js";
-import { SPACE_ADVANCE, glyphMarkup, layoutGlyph } from "./textLayout.js";
-import { TEXT_TIMING, canAnimate, eraseOut, fromMarkup, run, writeIn, type Flight, type TextOptions } from "./text.js";
+import { SPACE_ADVANCE, glyphMarkup, layoutGlyph, type TextGlyph } from "./textLayout.js";
+import { TEXT_TIMING, eraseOut, fromMarkup, run, writeIn, type TextOptions } from "./text.js";
 
-export interface TextFieldController {
-  /** Draw the input's value again — after setting `input.value` from code. */
-  refresh(): void;
-  /** New options. Anything that changes the drawing redraws the field at once. */
-  update(opts: TextOptions): void;
-  /** Stop listening, remove what the field drew, give the input its own look back. */
-  destroy(): void;
-}
+export { CARET_TIMING } from "./field.js";
 
-/** Timings of the caret, ms: a soft pulse, still while typing and for a moment after. */
-export const CARET_TIMING = { pulse: 1200, rest: 500 } as const;
+export type TextFieldController = FieldController<TextOptions>;
 
 /** Advance of a character the set cannot draw, glyph units: an empty box stands in for it. */
 const TOFU_ADVANCE = 9;
-const EASE_SLIDE = "cubic-bezier(.3,.7,.2,1)";
+/** Key of a character the set cannot draw: two of them are the same drawing. */
+const TOFU = "\u0000";
 
 /**
  * What the field draws for each character of the input, one to one: a
@@ -57,435 +42,78 @@ export function fieldChars(value: string): (string | null)[] {
   return out;
 }
 
-/** One character of the field as laid out, in pixels. */
-interface Cell {
-  key: string;
-  el: SVGSVGElement | null;
-  x: number;
-  w: number;
-}
-
 const SVGNS = "http://www.w3.org/2000/svg";
-const px = (n: number) => `${Math.round(n * 100) / 100}px`;
-
-/**
- * Takes over `field` — an element with an `<input>` inside — and draws the
- * input's value in the Tacet capitals, with a caret and a selection of its own.
- */
-export function createTextField(field: HTMLElement, opts: TextOptions = {}): TextFieldController {
-  const input = field.querySelector("input");
-  if (!input) throw new Error("tacet: createTextField needs an <input> inside the field");
-  let options: TextOptions = { ...opts };
-  const savedInputStyle = input.getAttribute("style");
-
-  // The field's own look is left to its stylesheet; these only fill what is missing.
-  const own = (key: string, value: string) => {
-    if (!field.style.getPropertyValue(key)) field.style.setProperty(key, value);
-  };
-  own("position", getComputedStyle(field).position === "static" ? "relative" : field.style.position);
-  own("display", "inline-block");
-  own("overflow", "hidden");
-  own("cursor", "text");
-  own("user-select", "none");
-  own("-webkit-user-select", "none");
-  own("touch-action", "pan-y");
-  Object.assign(input.style, {
-    position: "absolute", inset: "0", width: "100%", height: "100%", margin: "0", padding: "0", border: "0",
-    opacity: "0", pointerEvents: "none", fontSize: "16px", background: "transparent", caretColor: "transparent",
-  });
-
-  const layer = document.createElement("span");
-  layer.className = "tc-field";
-  layer.setAttribute("aria-hidden", "true");
-  const stage = document.createElement("span");
-  layer.appendChild(stage);
-  field.insertBefore(layer, input);
 
-  let cells: Cell[] = [];
-  let drawn = "";
-  let scroll = 0;
-  let caret: HTMLSpanElement | null = null;
-  let pulse: Animation | null = null;
-  let plate: HTMLSpanElement | null = null;
-  let frame = 0;
-  let marksFor = "";
-  const flights = new Set<Flight>();
+/** The empty box: the height of the capitals, the stroke of the letters, at half strength. */
+function tofu(w: number, { size, capTop, capBottom }: FieldMetrics, opts: TextOptions): SVGSVGElement {
+  const stroke = strokeOnScreen(size, opts);
+  const svg = document.createElementNS(SVGNS, "svg");
+  for (const [key, value] of Object.entries({ width: w, height: size, "aria-hidden": "true", class: "tc-tofu" })) svg.setAttribute(key, String(value));
+  svg.style.overflow = "visible";
+  const rect = document.createElementNS(SVGNS, "rect");
+  const inset = w * 0.2;
+  for (const [key, value] of Object.entries({
+    x: inset, y: capTop, width: w - 2 * inset, height: capBottom - capTop, rx: stroke, fill: "none",
+    stroke: "currentColor", "stroke-width": stroke, opacity: 0.45,
+  })) rect.setAttribute(key, String(value));
+  svg.appendChild(rect);
+  return svg;
+}
 
-  /** Sizes of the moment: size, the zoom of the glyph window and where the capitals sit in it. */
-  const geometry = () => {
-    const size = normalizeSize(options.size ?? 24);
-    const inset = insetFor(size);
-    const unit = size / (24 - 2 * inset);
-    return { size, unit, capTop: (4 - inset) * unit, capBottom: (20 - inset) * unit, pad: Math.round(size * 0.35) };
-  };
+const isTofu = (el: Element) => el.classList.contains("tc-tofu");
 
-  const placeLayer = () => {
-    const { size, pad } = geometry();
-    layer.setAttribute("style", `position:absolute;left:${pad}px;right:${pad}px;top:50%;height:${size}px;margin-top:${-size / 2}px;pointer-events:none`);
-    stage.setAttribute("style", `position:absolute;left:0;top:0;height:${size}px;color:inherit;transform:translateX(${-scroll}px)`);
-    if (!field.style.minHeight) field.style.minHeight = px(size * 1.6);
-    if (!field.style.minWidth) field.style.minWidth = px(size * 6);
-  };
+const textKind: FieldKind<TextOptions> = {
+  clean: (value) => value,
 
-  /** The layout of the value, one cell per character of the input. */
-  const layout = (value: string): { chars: (string | null)[]; glyphs: (ReturnType<typeof layoutGlyph> | null)[]; xs: number[]; ws: number[] } => {
-    const { unit } = geometry();
+  layout(value, opts, metrics) {
     const chars = fieldChars(value);
-    const glyphs: (ReturnType<typeof layoutGlyph> | null)[] = [];
-    const xs: number[] = [];
+    const glyphs: (TextGlyph | null)[] = [];
     const ws: number[] = [];
-    let x = 0;
     let runStart = 0;
     chars.forEach((ch, i) => {
       if (ch === null || ch === " ") {
         glyphs.push(null);
-        xs.push(x);
-        const w = (ch === " " ? SPACE_ADVANCE : TOFU_ADVANCE) * unit;
-        ws.push(w);
-        x += w;
+        ws.push((ch === " " ? SPACE_ADVANCE : TOFU_ADVANCE) * metrics.unit);
         runStart = i + 1;
         return;
       }
       // Kerning within a run of glyphs, as in a word of Text.
       let end = i;
       while (end + 1 < chars.length && chars[end + 1] !== null && chars[end + 1] !== " ") end++;
-      const run_ = chars.slice(runStart, end + 1) as string[];
-      const glyph = layoutGlyph(run_, i - runStart, options);
+      const glyph = layoutGlyph(chars.slice(runStart, end + 1) as string[], i - runStart, opts);
       glyphs.push(glyph);
-      xs.push(x);
-      const w = Number(glyph.svgAttrs["width"]);
-      ws.push(w);
-      x += w;
+      ws.push(Number(glyph.svgAttrs["width"]));
     });
-    return { chars, glyphs, xs, ws };
-  };
-
-  const tofu = (w: number) => {
-    const { size, capTop, capBottom } = geometry();
-    const stroke = strokeOnScreen(size, options);
-    const svg = document.createElementNS(SVGNS, "svg");
-    for (const [key, value] of Object.entries({ width: w, height: size, "aria-hidden": "true", class: "tc-tofu" })) svg.setAttribute(key, String(value));
-    svg.style.overflow = "visible";
-    const rect = document.createElementNS(SVGNS, "rect");
-    const inset = w * 0.2;
-    for (const [key, value] of Object.entries({
-      x: inset, y: capTop, width: w - 2 * inset, height: capBottom - capTop, rx: stroke, fill: "none",
-      stroke: "currentColor", "stroke-width": stroke, opacity: 0.45,
-    })) rect.setAttribute(key, String(value));
-    svg.appendChild(rect);
-    return svg;
-  };
-
-  const place = (el: Element, x: number) => {
-    (el as SVGSVGElement).style.position = "absolute";
-    (el as SVGSVGElement).style.left = px(x);
-    (el as SVGSVGElement).style.top = "0";
-  };
-
-  const settle = () => {
-    for (const flight of flights) {
-      for (const animation of flight.animations) animation.cancel();
-      flight.finish();
-    }
-    flights.clear();
-  };
-
-  /** Draws `value` still: no animation, the exact glyphs. */
-  const redraw = (value: string) => {
-    settle();
-    stage.replaceChildren();
-    caret = null;
-    plate = null;
-    const { chars, glyphs, xs, ws } = layout(value);
-    cells = chars.map((ch, i) => {
-      const key = ch ?? "\u0000";
-      let el: SVGSVGElement | null = null;
-      if (glyphs[i]) el = fromMarkup(glyphMarkup(glyphs[i]!)) as SVGSVGElement;
-      else if (ch === null) el = tofu(ws[i]!) as SVGSVGElement;
-      if (el) {
-        place(el, xs[i]!);
-        stage.appendChild(el);
-      }
-      return { key, el, x: xs[i]!, w: ws[i]! };
-    });
-    drawn = value;
-    placeholder();
-    marksFor = "";
-    paintMarks();
-  };
-
-  /** The placeholder, drawn in the same letters at 40%, while the field is empty. */
-  const placeholder = () => {
-    stage.querySelector(".tc-placeholder")?.remove();
-    const text = input.value ? "" : input.placeholder;
-    if (!text) return;
-    const { chars, glyphs, xs } = layout(text);
-    const hint = document.createElement("span");
-    hint.className = "tc-placeholder";
-    hint.setAttribute("style", "position:absolute;left:0;top:0;opacity:.4");
-    chars.forEach((_, i) => {
-      const glyph = glyphs[i];
-      if (!glyph) return;
-      const el = fromMarkup(glyphMarkup(glyph));
-      place(el, xs[i]!);
-      hint.appendChild(el);
-    });
-    stage.insertBefore(hint, stage.firstChild);
-  };
-
-  /** Draws `value` with the transition: the common head and tail stay, the rest erases and writes itself in. */
-  const change = (value: string) => {
-    if (!canAnimate()) {
-      redraw(value);
-      return;
-    }
-    settle();
-    const { chars, glyphs, xs, ws } = layout(value);
-    const keys = chars.map((ch) => ch ?? "\u0000");
-    const old = cells;
-    const kind = options.transition ?? "erase";
-    let head = 0;
-    let tail = 0;
-    if (kind !== "rewrite") {
-      while (head < old.length && head < keys.length && old[head]!.key === keys[head]) head++;
-      while (tail < old.length - head && tail < keys.length - head && old[old.length - 1 - tail]!.key === keys[keys.length - 1 - tail]) tail++;
-    }
-    const gone = old.slice(head, old.length - tail);
-    const flight: Flight = { animations: [], finish: () => {} };
-    const cleanups: Array<() => void> = [];
-    flight.finish = () => {
-      for (const cleanup of cleanups.splice(0)) cleanup();
-      flights.delete(flight);
+    return {
+      keys: chars.map((ch) => ch ?? TOFU),
+      ws,
+      draw(i) {
+        const glyph = glyphs[i];
+        if (glyph) return fromMarkup(glyphMarkup(glyph)) as SVGSVGElement;
+        return chars[i] === null ? tofu(ws[i]!, metrics, opts) : null;
+      },
+      refit(el, i) {
+        const glyph = glyphs[i];
+        if (glyph) for (const key of ["viewBox", "width"] as const) el.setAttribute(key, String(glyph.svgAttrs[key]));
+      },
     };
-    flights.add(flight);
-    const landing: Promise<unknown>[] = [];
+  },
+
+  isBreak: (char) => /\s/.test(char),
+  mode: (opts) => (opts.transition === "append" ? "append" : opts.transition === "rewrite" ? "rewrite" : "keep"),
+  leaveTime: TEXT_TIMING.erase,
+  leave: (flight, el) => (isTofu(el) ? run(flight, el, [{ opacity: 1 }, { opacity: 0 }], TEXT_TIMING.erase, 0, "ease") : eraseOut(flight, el)),
+  enter: (flight, el, delay) => (isTofu(el) ? run(flight, el, [{ opacity: 0 }, { opacity: 1 }], TEXT_TIMING.dot, delay, "ease") : writeIn(flight, el, delay)),
+  still(el) {
+    el.querySelector("mask")?.remove();
+    el.querySelector("g.tc-body")?.removeAttribute("mask");
+  },
+};
 
-    for (const cell of gone) {
-      if (!cell.el) continue;
-      const el = cell.el;
-      if (kind === "append") el.remove();
-      else {
-        landing.push(el.classList.contains("tc-tofu") ? Promise.resolve() : eraseOut(flight, el));
-        cleanups.push(() => el.remove());
-      }
-    }
-
-    const lag = kind !== "append" && gone.some((cell) => cell.el) ? TEXT_TIMING.lag : 0;
-    cells = keys.map((key, i) => {
-      const kept = i < head ? old[i] : i >= keys.length - tail ? old[old.length - (keys.length - i)] : undefined;
-      if (kept) {
-        if (kept.el) {
-          const from = kept.x;
-          place(kept.el, xs[i]!);
-          if (glyphs[i]) kept.el.setAttribute("viewBox", String(glyphs[i]!.svgAttrs["viewBox"]));
-          if (glyphs[i]) kept.el.setAttribute("width", String(glyphs[i]!.svgAttrs["width"]));
-          if (kind !== "append" && from !== xs[i]) {
-            landing.push(run(flight, kept.el, [{ left: px(from) }, { left: px(xs[i]!) }], TEXT_TIMING.slide, 0, EASE_SLIDE));
-          }
-        }
-        return { key, el: kept.el, x: xs[i]!, w: ws[i]! };
-      }
-      let el: SVGSVGElement | null = null;
-      if (glyphs[i]) {
-        el = fromMarkup(glyphMarkup(glyphs[i]!)) as SVGSVGElement;
-        place(el, xs[i]!);
-        stage.appendChild(el);
-        const svg = el;
-        landing.push(writeIn(flight, svg, lag));
-        cleanups.push(() => {
-          svg.querySelector("mask")?.remove();
-          svg.querySelector("g.tc-body")?.removeAttribute("mask");
-        });
-      } else if (key === "\u0000") {
-        el = tofu(ws[i]!) as SVGSVGElement;
-        place(el, xs[i]!);
-        stage.appendChild(el);
-      }
-      return { key, el, x: xs[i]!, w: ws[i]! };
-    });
-    drawn = value;
-    placeholder();
-    void Promise.all(landing).then(() => {
-      if (!flights.has(flight)) return;
-      for (const animation of flight.animations) animation.cancel();
-      flight.finish();
-    });
-  };
-
-  /** x of the boundary before cell k, in stage pixels. */
-  const edge = (k: number) => {
-    if (k < cells.length) return cells[k]!.x;
-    const last = cells[cells.length - 1];
-    return last ? last.x + last.w : 0;
-  };
-
-  const indexAt = (clientX: number) => {
-    const x = clientX - stage.getBoundingClientRect().left;
-    let best = 0;
-    let dist = Infinity;
-    for (let k = 0; k <= cells.length; k++) {
-      const d = Math.abs(edge(k) - x);
-      if (d < dist) { dist = d; best = k; }
-    }
-    return best;
-  };
-
-  const keepVisible = (x: number) => {
-    const room = Math.max(0, layer.clientWidth - 2);
-    if (x - scroll > room) scroll = x - room;
-    if (x - scroll < 0) scroll = Math.max(0, x);
-    stage.style.transform = `translateX(${-scroll}px)`;
-  };
-
-  /** The caret and the selection, from the layout; repainted only when something they depend on moved. */
-  const paintMarks = () => {
-    const focused = document.activeElement === input;
-    const a = input.selectionStart ?? 0;
-    const b = input.selectionEnd ?? 0;
-    const signature = `${focused}|${a}|${b}|${drawn}|${cells.length}`;
-    if (signature === marksFor) return;
-    marksFor = signature;
-    const { size, capTop, capBottom } = geometry();
-    const accent = options.accentColor ?? ACCENT_VAR;
-    plate?.remove();
-    plate = null;
-    if (!focused) {
-      caret?.remove();
-      caret = null;
-      pulse = null;
-      return;
-    }
-    if (a !== b) {
-      caret?.remove();
-      caret = null;
-      pulse = null;
-      const x0 = edge(a);
-      const x1 = edge(b);
-      plate = document.createElement("span");
-      plate.className = "tc-selection";
-      const pad = size * 0.12;
-      plate.setAttribute("style", `position:absolute;left:${px(x0 - 2)};width:${px(x1 - x0 + 4)};top:${px(capTop - pad)};height:${px(capBottom - capTop + 2 * pad)};border-radius:${px(size * 0.14)};background:${accent};opacity:.2`);
-      stage.insertBefore(plate, stage.firstChild);
-      keepVisible(input.selectionDirection === "backward" ? x0 : x1);
-      return;
-    }
-    const x = edge(a);
-    const stroke = strokeOnScreen(size, options);
-    if (!caret) {
-      caret = document.createElement("span");
-      caret.className = "tc-caret";
-      stage.appendChild(caret);
-    }
-    const over = size * 0.06;
-    caret.setAttribute("style", `position:absolute;left:${px(x - stroke / 2)};width:${px(stroke)};top:${px(capTop - over)};height:${px(capBottom - capTop + 2 * over)};border-radius:${px(stroke)};background:${accent}`);
-    // Still while it moves; the pulse comes back after a moment of rest.
-    pulse?.cancel();
-    pulse = typeof caret.animate === "function"
-      ? caret.animate([{ opacity: 1 }, { opacity: 0.12 }, { opacity: 1 }], {
-        duration: CARET_TIMING.pulse, delay: CARET_TIMING.rest, iterations: Infinity, easing: "ease-in-out",
-      })
-      : null;
-    keepVisible(x);
-  };
-
-  // The input moves its own selection on keys; the marks follow it frame by frame while it has the focus.
-  const nextFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : null;
-  const follow = () => {
-    frame = 0;
-    if (document.activeElement !== input || !nextFrame) return;
-    paintMarks();
-    frame = nextFrame(follow);
-  };
-
-  // The pointer lands where the layout says, never where the input's font would.
-  let anchor = 0;
-  let dragging = false;
-  const select = (from: number, to: number) => {
-    input.setSelectionRange(Math.min(from, to), Math.max(from, to), to < from ? "backward" : "forward");
-    paintMarks();
-  };
-  const onDown = (event: PointerEvent) => {
-    if (input.disabled) return;
-    event.preventDefault();
-    input.focus({ preventScroll: true });
-    const i = indexAt(event.clientX);
-    if (event.shiftKey) anchor = input.selectionDirection === "backward" ? input.selectionEnd ?? i : input.selectionStart ?? i;
-    else anchor = i;
-    select(anchor, i);
-    dragging = true;
-    try {
-      field.setPointerCapture?.(event.pointerId);
-    } catch {
-      // Not every environment tracks pointers; a drag then just ends at the edge.
-    }
-  };
-  const onMove = (event: PointerEvent) => {
-    if (dragging) select(anchor, indexAt(event.clientX));
-  };
-  const onUp = () => {
-    dragging = false;
-  };
-  const onDouble = (event: MouseEvent) => {
-    const i = indexAt(event.clientX);
-    const v = input.value;
-    let a = i;
-    let b = i;
-    while (a > 0 && !/\s/.test(v[a - 1]!)) a--;
-    while (b < v.length && !/\s/.test(v[b]!)) b++;
-    select(a, b);
-  };
-  const onClick = (event: MouseEvent) => {
-    if (event.detail === 3) select(0, input.value.length);
-  };
-  const onInput = () => change(input.value);
-  const onFocus = () => {
-    field.setAttribute("data-focused", "");
-    marksFor = "";
-    paintMarks();
-    if (!frame && nextFrame) frame = nextFrame(follow);
-  };
-  const onBlur = () => {
-    field.removeAttribute("data-focused");
-    marksFor = "";
-    paintMarks();
-  };
-
-  field.addEventListener("pointerdown", onDown);
-  field.addEventListener("pointermove", onMove);
-  field.addEventListener("pointerup", onUp);
-  field.addEventListener("dblclick", onDouble);
-  field.addEventListener("click", onClick);
-  input.addEventListener("input", onInput);
-  input.addEventListener("focus", onFocus);
-  input.addEventListener("blur", onBlur);
-
-  placeLayer();
-  redraw(input.value);
-
-  return {
-    refresh() {
-      if (input.value !== drawn) change(input.value);
-      else paintMarks();
-    },
-    update(next) {
-      options = { ...options, ...next };
-      placeLayer();
-      redraw(input.value);
-    },
-    destroy() {
-      settle();
-      if (frame && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
-      field.removeEventListener("pointerdown", onDown);
-      field.removeEventListener("pointermove", onMove);
-      field.removeEventListener("pointerup", onUp);
-      field.removeEventListener("dblclick", onDouble);
-      field.removeEventListener("click", onClick);
-      input.removeEventListener("input", onInput);
-      input.removeEventListener("focus", onFocus);
-      input.removeEventListener("blur", onBlur);
-      layer.remove();
-      if (savedInputStyle == null) input.removeAttribute("style");
-      else input.setAttribute("style", savedInputStyle);
-    },
-  };
+/**
+ * Takes over `field` — an element with an `<input>` inside — and draws the
+ * input's value in the Tacet capitals, with a caret and a selection of its own.
+ */
+export function createTextField(field: HTMLElement, opts: TextOptions = {}): TextFieldController {
+  return createField(field, opts, textKind, "createTextField");
 }
```

- [ ] **Step 5: Run the test again**

Run: `npx vitest run packages/core/src/textField.test.ts`
Expected: PASS — `Tests  14 passed (14)`.

- [ ] **Step 6: Look at it**

Build (`pnpm build`) and capture «Привет, мир!» → «Привет!» in a text field of size 40, frame by frame: right after the `input` event pause every animation of the field (`field.getAnimations({ subtree: true })`) and step their `currentTime` through 0, 80, 160, 220, 300, 380, 460, 560 and 800 ms, taking a screenshot at each. Do the same on `main`. Expected: on `main` «!» slides over «МИР» from the first frames; on the branch `,` and «МИР» erase where they stand, «!» waits and moves left only from 220 ms. Attach both captures side by side to TACET-65.

- [ ] **Step 7: Full check**

Run: `pnpm build && pnpm typecheck && pnpm test`
Expected: build and typecheck without errors, `Tests  265 passed (265)`.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/field.ts packages/core/src/textField.test.ts packages/core/src/textField.ts
git commit -m "TACET-65: one field control under the text field; the tail waits for the erase"
```

Push the branch and open a PR whose description starts with https://taskless.ru/app/smurov/tasks/TACET-65.

---

### Task 2: createDigitsField (TACET-66)

`createDigitsField(field, opts)` is the field of Task 1 with the digit slots of Digits. Its kind cleans the input to `[0-9:]` with the new `keepDigits` (`parseDigits` keeps its warning and now calls it), lays a value out in `slotSpec` slots — a digit 14 units wide, the colon 6 — and takes the group between two colons on a double click. The caret stays after what was typed: the field counts what the kind keeps of the text before the caret.

A digit that gives way to a digit turns into it where it stands, as in Digits. For that the field learns `turn`: after the common head and tail are kept, the gone and the new glyphs are paired from the left, and a pair the kind can turn is turned instead of erased and drawn anew. `turn` returns null where it cannot; then the old glyph leaves and the new one comes, in the field's order. The digits kind turns a pair of digits by the `transition` option — `morph`, `relay` or `erase` — with the slot functions of `digits.ts`, which now exports them: `makeSlot`, `settle`, `morph`, `relay`, `erase`, `appear` and the new `eraseStrokes`, split out of `vanish`. `morph` returns a promise that resolves when the contour lands, so the field does not leave the slot still halfway through. The colon never turns: it has no contour, so it fades out and in like the dots of the letters. A leaving digit erases its strokes in place (`DIGIT_TIMING.vanish`, 300 ms) and keeps its width; the field moves the tail itself.

**Files:**
- Create: `packages/core/src/digitsField.test.ts`, `packages/core/src/digitsField.ts`
- Modify: `packages/core/src/digits.ts`, `packages/core/src/digitsLayout.ts`, `packages/core/src/field.ts`, `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `createField`, `FieldKind` and `FieldController` from Task 1; `slotSpec` from `digitsLayout.ts`; `DIGIT_TIMING` and `DigitsOptions` from `digits.ts`; `TEXT_TIMING` and `run` from `text.ts`.
- Produces: `createDigitsField(field: HTMLElement, opts?: DigitsOptions): DigitsFieldController` and `type DigitsFieldController = FieldController<DigitsOptions>`, exported from `tacet-core`. `FieldKind.turn?(flight: Flight, el: SVGSVGElement, from: string, to: string, opts: O): Promise<unknown> | null`. `keepDigits(value: string): string` in `digitsLayout.ts`. Exported from `digits.ts` for the field (not from `index.ts`): `Slot`, `makeSlot(char, opts)`, `settle`, `morph` (now `Promise<void>`), `relay`, `erase`, `appear`, `eraseStrokes`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull
git switch -c tacet-66-digits-field
```

- [ ] **Step 2: Write the failing test**

Create `packages/core/src/digitsField.test.ts`:

```ts
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
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx vitest run packages/core/src/digitsField.test.ts`
Expected: FAIL — `Error: Failed to resolve import "./digitsField.js" from "packages/core/src/digitsField.test.ts". Does the file exist?`

- [ ] **Step 4: Implement**

Apply this change to `packages/core/src/digits.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/core/src/digits.ts b/packages/core/src/digits.ts
index 24e95b2..e15abb0 100644
--- a/packages/core/src/digits.ts
+++ b/packages/core/src/digits.ts
@@ -73,7 +73,8 @@ interface MorphState {
   spans: Pair4 | null;
 }
 
-interface Slot {
+/** One character of a number: its svg, and whatever runs on it. The digits field animates the same slots. */
+export interface Slot {
   char: string;
   svg: SVGSVGElement;
   /** Bumped by every new operation: a stale continuation compares and drops out. */
@@ -107,6 +108,11 @@ function buildSlot(spec: SlotSpec): SVGSVGElement {
   return svg;
 }
 
+/** A slot drawing `char` still. */
+export function makeSlot(char: string, opts: DigitsOptions): Slot {
+  return { char, svg: buildSlot(slotSpec(char, opts)), token: 0, animations: [], frame: 0, live: null };
+}
+
 /** Whether transitions can play: motion is welcome and the Web Animations API is there. */
 function canAnimate(): boolean {
   return !prefersReducedMotion()
@@ -131,7 +137,7 @@ function drawStill(slot: Slot, opts: DigitsOptions): void {
 }
 
 /** Stops whatever runs on the slot and leaves its character drawn still. */
-function settle(slot: Slot, opts: DigitsOptions): void {
+export function settle(slot: Slot, opts: DigitsOptions): void {
   stop(slot);
   slot.live = null;
   drawStill(slot, opts);
@@ -217,7 +223,8 @@ function retarget(slot: Slot, char: string): void {
   slot.svg.setAttribute("data-char", char);
 }
 
-function morph(slot: Slot, char: string, delay: number, opts: DigitsOptions): void {
+/** Turns the slot's contour into the one of `char`; resolves when it lands, never if cut short. */
+export function morph(slot: Slot, char: string, delay: number, opts: DigitsOptions): Promise<void> {
   const target = digitGeometry(char, opts);
   const goalPoints = sampleContour(target.d);
   const current = slot.live ?? (() => {
@@ -231,7 +238,7 @@ function morph(slot: Slot, char: string, delay: number, opts: DigitsOptions): vo
     // No way to measure a contour here: the digit simply changes.
     retarget(slot, char);
     settle(slot, opts);
-    return;
+    return Promise.resolve();
   }
 
   stop(slot);
@@ -277,23 +284,26 @@ function morph(slot: Slot, char: string, delay: number, opts: DigitsOptions): vo
 
   paint(0);
   const start = performance.now() + delay;
-  const step = (time: number) => {
-    if (token !== slot.token) return;
-    const k = Math.min(1, Math.max(0, (time - start) / DIGIT_TIMING.morph));
-    paint(easeInOutCubic(k));
-    if (k < 1) {
-      slot.frame = requestAnimationFrame(step);
-      return;
-    }
-    // The polyline lives only in flight: at rest the slot holds the exact glyph.
-    slot.frame = 0;
-    slot.live = null;
-    drawStill(slot, opts);
-  };
-  slot.frame = requestAnimationFrame(step);
+  return new Promise((resolve) => {
+    const step = (time: number) => {
+      if (token !== slot.token) return;
+      const k = Math.min(1, Math.max(0, (time - start) / DIGIT_TIMING.morph));
+      paint(easeInOutCubic(k));
+      if (k < 1) {
+        slot.frame = requestAnimationFrame(step);
+        return;
+      }
+      // The polyline lives only in flight: at rest the slot holds the exact glyph.
+      slot.frame = 0;
+      slot.live = null;
+      drawStill(slot, opts);
+      resolve();
+    };
+    slot.frame = requestAnimationFrame(step);
+  });
 }
 
-async function relay(slot: Slot, char: string, delay: number, opts: DigitsOptions): Promise<void> {
+export async function relay(slot: Slot, char: string, delay: number, opts: DigitsOptions): Promise<void> {
   // A relay mid-flight finishes at once: the new one starts from a still digit.
   settle(slot, opts);
   const token = slot.token;
@@ -317,7 +327,7 @@ async function relay(slot: Slot, char: string, delay: number, opts: DigitsOption
   inn.drop();
 }
 
-async function erase(slot: Slot, char: string, delay: number, opts: DigitsOptions): Promise<void> {
+export async function erase(slot: Slot, char: string, delay: number, opts: DigitsOptions): Promise<void> {
   settle(slot, opts);
   const token = slot.token;
   const old = bodyOf(slot);
@@ -338,7 +348,7 @@ async function erase(slot: Slot, char: string, delay: number, opts: DigitsOption
 }
 
 /** A new leading digit draws itself in. The colon has no contour to draw and just appears. */
-async function appear(slot: Slot, delay: number): Promise<void> {
+export async function appear(slot: Slot, delay: number): Promise<void> {
   if (slot.char === ":") return;
   const token = slot.token;
   const inn = reveal(slot.svg, bodyOf(slot), HIDDEN);
@@ -347,6 +357,13 @@ async function appear(slot: Slot, delay: number): Promise<void> {
   inn.drop();
 }
 
+/** Erases the slot's strokes where it stands. The colon has no contour to erase. */
+export async function eraseStrokes(slot: Slot): Promise<void> {
+  if (slot.char === ":") return;
+  const out = reveal(slot.svg, bodyOf(slot), 0);
+  await Promise.all(out.strokes.map((s) => run(slot, s, 0, HIDDEN, DIGIT_TIMING.vanish, 0, EASE_OUT)));
+}
+
 /** A leading digit that is no longer needed erases itself and gives its room back. */
 async function vanish(slot: Slot, opts: DigitsOptions): Promise<void> {
   settle(slot, opts);
@@ -359,10 +376,7 @@ async function vanish(slot: Slot, opts: DigitsOptions): Promise<void> {
   slot.animations.push(collapse);
   const collapsed = new Promise<void>((resolve) => collapse.addEventListener("finish", () => resolve(), { once: true }));
 
-  if (slot.char !== ":") {
-    const out = reveal(slot.svg, bodyOf(slot), 0);
-    await Promise.all(out.strokes.map((s) => run(slot, s, 0, HIDDEN, DIGIT_TIMING.vanish, 0, EASE_OUT)));
-  }
+  await eraseStrokes(slot);
   await collapsed;
   if (token !== slot.token) return;
   slot.svg.remove();
@@ -384,9 +398,7 @@ export function createDigits(host: Element, value: string | number, opts: Digits
   let slots: Slot[] = [];
   const retiring = new Set<Slot>();
 
-  const newSlot = (char: string): Slot => ({
-    char, svg: buildSlot(slotSpec(char, options)), token: 0, animations: [], frame: 0, live: null,
-  });
+  const newSlot = (char: string): Slot => makeSlot(char, options);
 
   const rebuild = () => {
     for (const slot of [...slots, ...retiring]) stop(slot);
@@ -407,7 +419,7 @@ export function createDigits(host: Element, value: string | number, opts: Digits
     const kind = options.transition ?? "morph";
     if (kind === "relay") void relay(slot, char, delay, options);
     else if (kind === "erase") void erase(slot, char, delay, options);
-    else morph(slot, char, delay, options);
+    else void morph(slot, char, delay, options);
   };
 
   rebuild();
```

Create `packages/core/src/digitsField.ts`:

```ts
// A field for numbers — the field of field.ts with the digits of Digits.
//
// It holds the digits and the colon only: whatever else is typed or pasted is
// taken out of the input at once, and the caret stays among what is left. The
// digits are tabular, so a caret between two of them stands where it stood. A
// digit that gives way to a digit turns into it where it stands, the way
// Digits does it; the rest goes as in the text field — what went erases, the
// tail moves, the new digits draw themselves in. A double click takes the
// group between two colons.

import { DIGIT_TIMING, appear, erase, eraseStrokes, makeSlot, morph, relay, settle, type DigitsOptions, type Slot } from "./digits.js";
import { keepDigits, slotSpec } from "./digitsLayout.js";
import { createField, type FieldController, type FieldKind } from "./field.js";
import { TEXT_TIMING, run } from "./text.js";

export type DigitsFieldController = FieldController<DigitsOptions>;

/** The slot behind each svg the field draws: the field places svgs, the digits engine animates slots. */
const slots = new WeakMap<SVGSVGElement, Slot>();
const slotOf = (el: SVGSVGElement) => slots.get(el)!;

const isColon = (el: SVGSVGElement) => slotOf(el).char === ":";

const digitsKind: FieldKind<DigitsOptions> = {
  clean: keepDigits,

  layout(value, opts) {
    const keys = value.split("");
    return {
      keys,
      ws: keys.map((char) => Number(slotSpec(char, opts).svgAttrs["width"])),
      draw(i) {
        const slot = makeSlot(keys[i]!, opts);
        slots.set(slot.svg, slot);
        return slot.svg;
      },
      refit() {},
    };
  },

  isBreak: (char) => char === ":",
  mode: () => "keep",
  leaveTime: DIGIT_TIMING.vanish,

  // The colon has no contour to draw or erase: its dots fade, like the dots of the letters.
  leave(flight, el, opts) {
    if (isColon(el)) return run(flight, el, [{ opacity: 1 }, { opacity: 0 }], TEXT_TIMING.dot, 0, "ease");
    settle(slotOf(el), opts);
    return eraseStrokes(slotOf(el));
  },
  enter(flight, el, delay) {
    if (isColon(el)) return run(flight, el, [{ opacity: 0 }, { opacity: 1 }], TEXT_TIMING.dot, delay, "ease");
    return appear(slotOf(el), delay);
  },
  turn(_flight, el, from, to, opts) {
    if (from === ":" || to === ":") return null;
    const slot = slotOf(el);
    if (opts.transition === "relay") return relay(slot, to, 0, opts);
    if (opts.transition === "erase") return erase(slot, to, 0, opts);
    return morph(slot, to, 0, opts);
  },
  still: (el, opts) => settle(slotOf(el), opts),
};

/**
 * Takes over `field` — an element with an `<input>` inside — and draws the
 * input's value in the Tacet digits, with a caret and a selection of its own.
 * The input keeps the digits and the colon only.
 */
export function createDigitsField(field: HTMLElement, opts: DigitsOptions = {}): DigitsFieldController {
  return createField(field, opts, digitsKind, "createDigitsField");
}
```

Apply this change to `packages/core/src/digitsLayout.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/core/src/digitsLayout.ts b/packages/core/src/digitsLayout.ts
index 2c5e95e..78ae2e6 100644
--- a/packages/core/src/digitsLayout.ts
+++ b/packages/core/src/digitsLayout.ts
@@ -41,10 +41,15 @@ const COLON_DOT = 0.62;
 
 const round = (n: number) => Math.round(n * 100) / 100;
 
+/** What a number can show out of `value`: the digits and the colon. */
+export function keepDigits(value: string): string {
+  return value.replace(/[^0-9:]/g, "");
+}
+
 /** The characters a number can show. Anything else is dropped with a warning. */
 export function parseDigits(value: string | number): string {
   const raw = String(value);
-  const kept = raw.replace(/[^0-9:]/g, "");
+  const kept = keepDigits(raw);
   if (kept.length !== raw.length && typeof console !== "undefined") {
     console.warn(`tacet: a number shows 0–9 and ":" only, the rest of "${raw}" is dropped`);
   }
```

Apply this change to `packages/core/src/field.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/core/src/field.ts b/packages/core/src/field.ts
index 5cab9ea..8d99d8a 100644
--- a/packages/core/src/field.ts
+++ b/packages/core/src/field.ts
@@ -10,10 +10,10 @@
 //
 // One character of the input is one cell of the field: the caret index in the
 // input is the index in the layout. The kind says which characters the input
-// may hold, how wide each one is and how it is drawn, and how a glyph comes
-// and goes. The order of a change belongs to the field and is the same for
-// every kind: what went erases where it stands, then the tail moves, then the
-// new glyphs come — the order TACET-63 settled for a line.
+// may hold, how wide each one is and how it is drawn, and how a glyph comes,
+// goes and turns into another. The order of a change belongs to the field and
+// is the same for every kind: what went erases where it stands, then the tail
+// moves, then the new glyphs come — the order TACET-63 settled for a line.
 //
 // Chosen on the demo of 24.09.2026: the caret is a stroke in the accent colour,
 // as thick as the glyphs; the selection is a plate of the accent at 20%.
@@ -78,6 +78,11 @@ export interface FieldKind<O extends FieldOptions> {
   leave(flight: Flight, el: SVGSVGElement, opts: O): Promise<unknown>;
   /** Brings a new glyph in, starting after `delay`. */
   enter(flight: Flight, el: SVGSVGElement, delay: number, opts: O): Promise<unknown>;
+  /**
+   * Turns the glyph where it stands into another, as a digit turns into a
+   * digit; null where it cannot, and then the old one goes and the new one comes.
+   */
+  turn?(flight: Flight, el: SVGSVGElement, from: string, to: string, opts: O): Promise<unknown> | null;
   /** Leaves a drawing still, whatever runs on it. */
   still(el: SVGSVGElement, opts: O): void;
 }
@@ -246,8 +251,23 @@ export function createField<O extends FieldOptions>(field: HTMLElement, opts: O,
     flights.add(flight);
     const landing: Promise<unknown>[] = [];
 
+    // Where a glyph gives way to another at the same place, the kind may turn one into the other.
+    const turned: (Cell | undefined)[] = [];
+    if (kind.turn && mode !== "append") {
+      const pairs = Math.min(gone.length, keys.length - head - tail);
+      for (let j = 0; j < pairs; j++) {
+        const cell = gone[j]!;
+        const el = cell.el;
+        const landed = el && kind.turn(flight, el, cell.key, keys[head + j]!, options);
+        if (!el || !landed) continue;
+        turned[j] = cell;
+        landing.push(landed);
+        cleanups.push(() => kind.still(el, options));
+      }
+    }
+
     // What went erases where it stands; the tail and the new glyphs wait for it.
-    const leaving = gone.filter((cell) => cell.el);
+    const leaving = gone.filter((cell, j) => cell.el && !turned[j]);
     const erased = mode !== "append" && leaving.length ? kind.leaveTime : 0;
     for (const cell of leaving) {
       const el = cell.el!;
@@ -274,6 +294,11 @@ export function createField<O extends FieldOptions>(field: HTMLElement, opts: O,
         }
         return { key, el: kept.el, x: xs[i]!, w: ws[i]! };
       }
+      const was = turned[i - head];
+      if (was) {
+        slide(was.el!, was.x, xs[i]!);
+        return { key, el: was.el, x: xs[i]!, w: ws[i]! };
+      }
       const el = laid.draw(i);
       if (el) {
         place(el, xs[i]!);
```

Apply this change to `packages/core/src/index.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/core/src/index.ts b/packages/core/src/index.ts
index 3eb2d43..1bc1ea4 100644
--- a/packages/core/src/index.ts
+++ b/packages/core/src/index.ts
@@ -39,3 +39,5 @@ export type { TextController, TextOptions } from "./text.js";
 
 export { createTextField, fieldChars, CARET_TIMING } from "./textField.js";
 export type { TextFieldController } from "./textField.js";
+export { createDigitsField } from "./digitsField.js";
+export type { DigitsFieldController } from "./digitsField.js";
```

- [ ] **Step 5: Run the test again**

Run: `npx vitest run packages/core/src/digitsField.test.ts`
Expected: PASS — `Tests  11 passed (11)`.

- [ ] **Step 6: Look at it**

Build and capture three changes in a digits field of size 40 the way Task 1 captured the text field: «12:30» → «12:45»; «12345» → «1205» (the value set with the caret after the 0, as if «34» were selected and 0 typed); «12:34» → «12834». The morph runs on `requestAnimationFrame`, so pausing the Web Animations does not hold it: its in-between frames come out approximate. Expected: in «1205» the 3 turns into the 0 in place, the 4 erases, the 5 moves up only after it; in «12834» the colon fades, the tail moves right, the 8 draws in after the erase. Then focus a text field and a digits field of the same size, put the caret after «12» of «12:45» and select «45»: the caret is the same accent stroke, as tall as the digits, and the selection the same plate. Attach the captures and the caret screenshot to TACET-66.

- [ ] **Step 7: Full check**

Run: `pnpm build && pnpm typecheck && pnpm test`
Expected: build and typecheck without errors, `Tests  276 passed (276)`.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/digits.ts packages/core/src/digitsField.test.ts packages/core/src/digitsField.ts packages/core/src/digitsLayout.ts packages/core/src/field.ts packages/core/src/index.ts
git commit -m "TACET-66: createDigitsField — the field with the digits of Digits"
```

Push the branch and open a PR whose description starts with https://taskless.ru/app/smurov/tasks/TACET-66.

---

### Task 3: DigitsField for React (TACET-67)

`DigitsField` is `TextField`'s twin, so what both share moves into `field.tsx`: `FieldProps` — the input's props without `size`, `className` and `style`, plus the look props and the box's `className` and `style` — and `useField(create, opts, optionDeps, ref)`, which mounts the core controller once, hands later options to `update()` and calls `refresh()` after every render. `TextField` becomes a few lines over it, and its four tests pass unchanged.

The third new test catches a bug of Task 2 that jsdom alone does not show. React watches an input's `value` property and compares it with the last value it saw. The field wrote a cleaned value through that property, so after «123a» was typed into a controlled field and cleaned to «123», React saw no change, never called `onChange`, and kept its state at «12» while the field showed «123». The field now writes through the `HTMLInputElement.prototype` setter, the way typing writes. With `DigitsField` in place but without that change in `field.ts`, the test fails with `expected '12' to be '123'`.

**Files:**
- Create: `packages/react/src/DigitsField.test.tsx`, `packages/react/src/DigitsField.tsx`, `packages/react/src/field.tsx`
- Modify: `packages/core/src/field.ts`, `packages/react/src/TextField.tsx`, `packages/react/src/index.ts`

**Interfaces:**
- Consumes: `createTextField`, `createDigitsField`, `TextTransition`, `DigitsTransition` and `IconVariant` from `tacet-core` — built: the React tests import `packages/core/dist`.
- Produces: `DigitsField` and `DigitsFieldProps`, exported from `tacet-react`. Internal `field.tsx`: `FieldProps` and `useField<O>(create: (field: HTMLElement, opts: O) => Controller<O>, opts: O, optionDeps: DependencyList, ref: ForwardedRef<HTMLInputElement>): { field, input }`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull
git switch -c tacet-67-react-digits-field
```

- [ ] **Step 2: Write the failing test**

Create `packages/react/src/DigitsField.test.tsx`:

```tsx
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
```

- [ ] **Step 3: Run it and watch it fail**

Run: `pnpm build && npx vitest run packages/react/src/DigitsField.test.tsx packages/react/src/TextField.test.tsx`
Expected: FAIL — `Error: Failed to resolve import "./DigitsField.js" from "packages/react/src/DigitsField.test.tsx". Does the file exist?`; `TextField.test.tsx` still passes, `Tests  4 passed (4)`.

- [ ] **Step 4: Implement**

Apply this change to `packages/core/src/field.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/core/src/field.ts b/packages/core/src/field.ts
index 8d99d8a..bd6264c 100644
--- a/packages/core/src/field.ts
+++ b/packages/core/src/field.ts
@@ -455,7 +455,12 @@ export function createField<O extends FieldOptions>(field: HTMLElement, opts: O,
     const value = kind.clean(raw);
     if (value === raw) return value;
     const at = kind.clean(raw.slice(0, input.selectionStart ?? raw.length)).length;
-    input.value = value;
+    // Written the way typing writes it, past a framework's own watch on the
+    // property: React compares the value with the last one it saw and would
+    // take a cleaned value for no change at all.
+    const write = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
+    if (write) write.call(input, value);
+    else input.value = value;
     if (document.activeElement === input) input.setSelectionRange(at, at);
     return value;
   };
```

Create `packages/react/src/DigitsField.tsx`:

```tsx
// A field for numbers, drawn in the Tacet digits, for React — TextField's twin
// on the same box, input and mounting (field.tsx). The input keeps the digits
// and the colon only, whatever is typed or pasted.

import { forwardRef } from "react";
import { createDigitsField, type DigitsTransition } from "tacet-core";
import { useField, type FieldProps } from "./field.js";

export interface DigitsFieldProps extends FieldProps {
  /** How a digit turns into another. Defaults to "morph". */
  transition?: DigitsTransition | undefined;
}

export const DigitsField = forwardRef<HTMLInputElement, DigitsFieldProps>(function DigitsField(
  { size = 24, variant, solid, accentColor, strokeWidth, absoluteStroke, transition, className, style, ...inputProps },
  ref,
) {
  const { field, input } = useField(
    createDigitsField,
    { size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition },
    [size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition],
    ref,
  );
  return (
    <span ref={field} className={className} style={style}>
      <input ref={input} {...inputProps} />
    </span>
  );
});
```

Apply this change to `packages/react/src/TextField.tsx` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/react/src/TextField.tsx b/packages/react/src/TextField.tsx
index 18b77c7..679cb3a 100644
--- a/packages/react/src/TextField.tsx
+++ b/packages/react/src/TextField.tsx
@@ -1,81 +1,25 @@
-// A text field that draws what is typed in the Tacet capitals, for React.
-//
-// A real <input> sits inside: it keeps the focus, the caret, the selection,
-// copy and paste, and its place in a form. The controller from tacet-core draws
-// the letters, the caret and the selection over it once mounted — before that,
-// and without scripts at all, the field is a plain working input.
-//
-// `className` and `style` go to the field, the box people see; every other prop
-// goes to the input, and so does the ref.
+// A text field that draws what is typed in the Tacet capitals, for React. The
+// box, the input and the mounting are the ones every field shares (field.tsx).
 
-import {
-  forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, type CSSProperties, type InputHTMLAttributes,
-} from "react";
-import {
-  createTextField,
-  type IconVariant, type TextFieldController, type TextOptions, type TextTransition,
-} from "tacet-core";
+import { forwardRef } from "react";
+import { createTextField, type TextTransition } from "tacet-core";
+import { useField, type FieldProps } from "./field.js";
 
-export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "className" | "style"> {
-  /** Height of the letters in pixels, the same `size` an Icon takes. Defaults to 24. */
-  size?: number | undefined;
-  /** A — one cut · B — all · C — one and accent · D — all and accent. Defaults to D. */
-  variant?: IconVariant | undefined;
-  /** Solid contour: cuts are not drawn. */
-  solid?: boolean | undefined;
-  /** Colour of the accents, the caret and the selection. Defaults to the --tacet-accent variable. */
-  accentColor?: string | undefined;
-  /** Stroke width on screen, in pixels. Once set, size does not affect it. */
-  strokeWidth?: number | undefined;
-  /** Stroke stops following size. */
-  absoluteStroke?: boolean | undefined;
+export interface TextFieldProps extends FieldProps {
   /** How the text changes as it is typed. Defaults to "erase". */
   transition?: TextTransition | undefined;
-  /** Class of the field — the box around the letters. */
-  className?: string | undefined;
-  /** Style of the field — the box around the letters. */
-  style?: CSSProperties | undefined;
 }
 
-// useLayoutEffect warns during server rendering, and on the server there is
-// nothing to take over anyway.
-const useMountEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
-
 export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
   { size = 24, variant, solid, accentColor, strokeWidth, absoluteStroke, transition, className, style, ...inputProps },
   ref,
 ) {
-  const field = useRef<HTMLSpanElement | null>(null);
-  const input = useRef<HTMLInputElement | null>(null);
-  const controller = useRef<TextFieldController | null>(null);
-  const opts: TextOptions = { size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition };
-  const latest = useRef(opts);
-  latest.current = opts;
-
-  useImperativeHandle(ref, () => input.current!, []);
-
-  useMountEffect(() => {
-    if (!field.current) return;
-    const control = createTextField(field.current, latest.current);
-    controller.current = control;
-    return () => {
-      control.destroy();
-      controller.current = null;
-    };
-    // Mount only: later options go through update(), later values through refresh().
-    // eslint-disable-next-line react-hooks/exhaustive-deps
-  }, []);
-
-  useEffect(() => {
-    controller.current?.update(latest.current);
-  }, [size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition]);
-
-  // A controlled value is written into the input by React without an input
-  // event; after every render the field draws whatever the input now holds.
-  useEffect(() => {
-    controller.current?.refresh();
-  });
-
+  const { field, input } = useField(
+    createTextField,
+    { size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition },
+    [size, variant, solid, accentColor, strokeWidth, absoluteStroke, transition],
+    ref,
+  );
   return (
     <span ref={field} className={className} style={style}>
       <input ref={input} {...inputProps} />
```

Create `packages/react/src/field.tsx`:

```tsx
// What the two fields share on the React side: the box people see with a real
// <input> inside, and a controller from tacet-core mounted over them. The text
// field and the digits field differ only in the controller they mount.
//
// A real <input> keeps the focus, the caret, the selection, copy and paste, and
// its place in a form. The controller draws the glyphs, the caret and the
// selection over it once mounted — before that, and without scripts at all, the
// field is a plain working input. `className` and `style` go to the field, the
// box people see; every other prop goes to the input, and so does the ref.

import {
  useEffect, useImperativeHandle, useLayoutEffect, useRef,
  type CSSProperties, type DependencyList, type ForwardedRef, type InputHTMLAttributes, type MutableRefObject,
} from "react";
import type { IconVariant } from "tacet-core";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "className" | "style"> {
  /** Height of the glyphs in pixels, the same `size` an Icon takes. Defaults to 24. */
  size?: number | undefined;
  /** A — one cut · B — all · C — one and accent · D — all and accent. Defaults to D. */
  variant?: IconVariant | undefined;
  /** Solid contour: cuts are not drawn. */
  solid?: boolean | undefined;
  /** Colour of the accents, the caret and the selection. Defaults to the --tacet-accent variable. */
  accentColor?: string | undefined;
  /** Stroke width on screen, in pixels. Once set, size does not affect it. */
  strokeWidth?: number | undefined;
  /** Stroke stops following size. */
  absoluteStroke?: boolean | undefined;
  /** Class of the field — the box around the glyphs. */
  className?: string | undefined;
  /** Style of the field — the box around the glyphs. */
  style?: CSSProperties | undefined;
}

/** What createTextField and createDigitsField give. */
interface Controller<O> {
  refresh(): void;
  update(opts: O): void;
  destroy(): void;
}

// useLayoutEffect warns during server rendering, and on the server there is
// nothing to take over anyway.
const useMountEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Mounts `create` over the field once; later options go to update() when one
 * of `optionDeps` changes, later values to refresh() after every render.
 * Returns the refs for the field and its input.
 */
export function useField<O>(
  create: (field: HTMLElement, opts: O) => Controller<O>,
  opts: O,
  optionDeps: DependencyList,
  ref: ForwardedRef<HTMLInputElement>,
): { field: MutableRefObject<HTMLSpanElement | null>; input: MutableRefObject<HTMLInputElement | null> } {
  const field = useRef<HTMLSpanElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const controller = useRef<Controller<O> | null>(null);
  const latest = useRef(opts);
  latest.current = opts;

  useImperativeHandle(ref, () => input.current!, []);

  useMountEffect(() => {
    if (!field.current) return;
    const control = create(field.current, latest.current);
    controller.current = control;
    return () => {
      control.destroy();
      controller.current = null;
    };
    // Mount only: later options go through update(), later values through refresh().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controller.current?.update(latest.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, optionDeps);

  // A controlled value is written into the input by React without an input
  // event; after every render the field draws whatever the input now holds.
  useEffect(() => {
    controller.current?.refresh();
  });

  return { field, input };
}
```

Apply this change to `packages/react/src/index.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/react/src/index.ts b/packages/react/src/index.ts
index 60d0298..b932e79 100644
--- a/packages/react/src/index.ts
+++ b/packages/react/src/index.ts
@@ -10,6 +10,8 @@ export type { TextProps } from "./Text.js";
 export type { TextTransition } from "tacet-core";
 export { TextField } from "./TextField.js";
 export type { TextFieldProps } from "./TextField.js";
+export { DigitsField } from "./DigitsField.js";
+export type { DigitsFieldProps } from "./DigitsField.js";
 
 // Core data and helpers, so a gallery or a generator needs no second package.
 export { iconNames, hasIcon, strokeOnScreen, STROKE_AT_24, ACCENT_VAR } from "tacet-core";
```

- [ ] **Step 5: Run the test again**

Run: `pnpm build && npx vitest run packages/react/src/DigitsField.test.tsx packages/react/src/TextField.test.tsx`
Expected: PASS — `Tests  8 passed (8)`.

- [ ] **Step 6: Full check**

Run: `pnpm build && pnpm typecheck && pnpm test`
Expected: build and typecheck without errors, `Tests  280 passed (280)`.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/field.ts packages/react/src/DigitsField.test.tsx packages/react/src/DigitsField.tsx packages/react/src/TextField.tsx packages/react/src/field.tsx packages/react/src/index.ts
git commit -m "TACET-67: DigitsField for React, on the field TextField stands on"
```

Push the branch and open a PR whose description starts with https://taskless.ru/app/smurov/tasks/TACET-67.

---

### Task 4: <tacet-digits-field> and parity (TACET-68)

The same split for the custom elements. `TacetFieldElement` holds what both fields share — the input inside, the mirrored attributes, `label`, `value`, `input`, the look attributes — and asks a subclass for two things, `create(field, opts)` and `options()`. `<tacet-text-field>` and the new `<tacet-digits-field>` are a dozen lines each. The package registers the new element on import; `defineTacetDigitsField(tag)` takes another tag. Four new tests in `parity.test.ts`: the mirrored attributes, the input keeping digits with its event bubbling out, `value` both ways, and the same DOM as the React `DigitsField`.

**Files:**
- Create: `packages/element/src/TacetDigitsFieldElement.ts`, `packages/element/src/TacetFieldElement.ts`
- Modify: `packages/element/src/TacetTextFieldElement.ts`, `packages/element/src/index.ts`, `packages/element/src/parity.test.ts`

**Interfaces:**
- Consumes: `createDigitsField`, `DigitsFieldController`, `DigitsOptions` and `DigitsTransition` from `tacet-core`; `DigitsField` from `tacet-react` (Task 3) — both built.
- Produces: `TacetDigitsFieldElement` and `defineTacetDigitsField(tag = "tacet-digits-field")`, exported from `tacet-element`. Internal `TacetFieldElement<O>`: `protected abstract create(field, opts)`, `protected abstract options(): O`, `protected commonOptions(): CommonFieldOptions`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull
git switch -c tacet-68-element-digits-field
```

- [ ] **Step 2: Write the failing test**

Apply this change to `packages/element/src/parity.test.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/element/src/parity.test.ts b/packages/element/src/parity.test.ts
index 1ced1e4..4ac029b 100644
--- a/packages/element/src/parity.test.ts
+++ b/packages/element/src/parity.test.ts
@@ -6,18 +6,20 @@ import { createElement } from "react";
 import { renderToStaticMarkup } from "react-dom/server";
 import { act } from "react";
 import { createRoot } from "react-dom/client";
-import { Digits, Icon, Text, TextField } from "tacet-react";
+import { Digits, DigitsField, Icon, Text, TextField } from "tacet-react";
 import { iconNames } from "tacet-core";
 import { defineTacetIcon } from "./TacetIconElement.js";
 import { defineTacetDigits } from "./TacetDigitsElement.js";
 import { defineTacetText } from "./TacetTextElement.js";
 import { defineTacetTextField } from "./TacetTextFieldElement.js";
+import { defineTacetDigitsField } from "./TacetDigitsFieldElement.js";
 
 beforeAll(() => {
   defineTacetIcon();
   defineTacetDigits();
   defineTacetText();
   defineTacetTextField();
+  defineTacetDigitsField();
 });
 
 /** Markup of the React wrapper, parsed into DOM. */
@@ -260,3 +262,54 @@ describe("<tacet-text-field>", () => {
     act(() => root.unmount());
   });
 });
+
+describe("<tacet-digits-field>", () => {
+  const fieldOf = (attrs: Record<string, string>) => {
+    const el = document.createElement("tacet-digits-field");
+    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
+    document.body.appendChild(el);
+    return el as HTMLElement & { value: string; input: HTMLInputElement };
+  };
+  const drawn = (el: Element) =>
+    Array.from(el.querySelectorAll(".tc-field svg[data-char]")).map((svg) => svg.getAttribute("data-char")).join("");
+
+  it("holds a real input with the mirrored attributes", () => {
+    const el = fieldOf({ value: "12:30", inputmode: "numeric", name: "at", label: "Time" });
+    const input = el.querySelector("input")!;
+    expect(input.value).toBe("12:30");
+    expect(input.getAttribute("inputmode")).toBe("numeric");
+    expect(input.getAttribute("name")).toBe("at");
+    expect(input.getAttribute("aria-label")).toBe("Time");
+    expect(drawn(el)).toBe("12:30");
+  });
+
+  it("the input keeps the digits and the colon, and the event bubbles out with them", () => {
+    const el = fieldOf({ value: "" });
+    let heard = "";
+    el.addEventListener("input", () => { heard = el.value; });
+    el.input.value = "4 шт.";
+    el.input.dispatchEvent(new Event("input", { bubbles: true }));
+    expect(heard).toBe("4");
+    expect(drawn(el)).toBe("4");
+  });
+
+  it("value reads and writes the input, and the digits follow", () => {
+    const el = fieldOf({ value: "1" });
+    el.value = "10:45";
+    expect(el.input.value).toBe("10:45");
+    expect(drawn(el)).toBe("10:45");
+  });
+
+  it("draws what the React field draws", () => {
+    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
+    const container = document.createElement("div");
+    document.body.appendChild(container);
+    const root = createRoot(container);
+    act(() => root.render(createElement(DigitsField, { defaultValue: "09:41", size: 32 })));
+    const el = fieldOf({ value: "09:41", size: "32" });
+    const layer = (host: Element) => Array.from(host.querySelectorAll(".tc-field svg")).map(shape);
+    expect(layer(el)).toHaveLength(5);
+    expect(layer(el)).toEqual(layer(container));
+    act(() => root.unmount());
+  });
+});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `pnpm build && npx vitest run packages/element/src/parity.test.ts`
Expected: FAIL — `Error: Failed to resolve import "./TacetDigitsFieldElement.js" from "packages/element/src/parity.test.ts". Does the file exist?`, `Tests  no tests`.

- [ ] **Step 4: Implement**

Create `packages/element/src/TacetDigitsFieldElement.ts`:

```ts
// <tacet-digits-field> — a field for numbers, drawn in the Tacet digits, for
// projects without React: <tacet-text-field>'s twin (TacetFieldElement.ts).
// The input keeps the digits and the colon only, whatever is typed or pasted.

import { createDigitsField, type DigitsFieldController, type DigitsOptions, type DigitsTransition } from "tacet-core";
import { TacetFieldElement } from "./TacetFieldElement.js";

export class TacetDigitsFieldElement extends TacetFieldElement<DigitsOptions> {
  protected create(field: HTMLElement, opts: DigitsOptions): DigitsFieldController {
    return createDigitsField(field, opts);
  }

  protected options(): DigitsOptions {
    return { ...this.commonOptions(), transition: (this.getAttribute("transition") as DigitsTransition | null) ?? undefined };
  }
}

/** Register <tacet-digits-field>. Calling again is harmless; in Node it stays quiet. */
export function defineTacetDigitsField(tag = "tacet-digits-field"): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(tag)) return;
  customElements.define(tag, TacetDigitsFieldElement);
}
```

Create `packages/element/src/TacetFieldElement.ts`:

```ts
// What <tacet-text-field> and <tacet-digits-field> share. The element is the
// field; a real <input> lives inside it, in the light DOM, so it keeps the
// focus, the caret, the selection and its place in a form, and its `input` and
// `change` events bubble out of the element as they are. The input's
// attributes are mirrored from the element's; `value` reads and writes the
// input. The two fields differ only in the controller they mount and in how
// they read `transition`.

import type { IconVariant } from "tacet-core";

/** Attributes handed straight to the inner input. */
const MIRRORED = ["placeholder", "name", "maxlength", "disabled", "readonly", "autocomplete", "inputmode", "required"] as const;

/** What createTextField and createDigitsField give. */
interface Controller<O> {
  refresh(): void;
  update(opts: O): void;
  destroy(): void;
}

/** The options both fields read from their attributes. */
export interface CommonFieldOptions {
  size: number | undefined;
  variant: IconVariant | undefined;
  solid: boolean | undefined;
  strokeWidth: number | undefined;
  absoluteStroke: boolean | undefined;
  accentColor: string | undefined;
}

export abstract class TacetFieldElement<O> extends HTMLElement {
  static observedAttributes = [
    "value", "label", ...MIRRORED,
    "size", "variant", "solid", "stroke-width", "absolute-stroke", "accent-color", "transition",
  ];

  #input: HTMLInputElement | null = null;
  #field: Controller<O> | null = null;

  /** Takes over the element with the controller of this field. */
  protected abstract create(field: HTMLElement, opts: O): Controller<O>;
  /** Every option, present or not: a removed attribute gives the option back. */
  protected abstract options(): O;

  connectedCallback(): void {
    if (!this.#input) {
      this.#input = this.querySelector("input") ?? document.createElement("input");
      if (!this.#input.isConnected) {
        this.#input.value = this.getAttribute("value") ?? "";
        this.appendChild(this.#input);
      }
    }
    for (const name of MIRRORED) this.#mirror(name);
    this.#label();
    this.#field = this.create(this, this.options());
  }

  disconnectedCallback(): void {
    this.#field?.destroy();
    this.#field = null;
  }

  attributeChangedCallback(name: string): void {
    if (!this.#input) return;
    if (name === "value") {
      this.#input.value = this.getAttribute("value") ?? "";
      this.#field?.refresh();
    } else if (name === "label") this.#label();
    else if ((MIRRORED as readonly string[]).includes(name)) this.#mirror(name);
    else this.#field?.update(this.options());
  }

  /** What is typed in the field. */
  get value(): string {
    return this.#input?.value ?? this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    if (!this.#input) {
      this.setAttribute("value", next);
      return;
    }
    this.#input.value = next;
    this.#field?.refresh();
  }

  /** The input inside, for focus and selection from code. */
  get input(): HTMLInputElement | null {
    return this.#input;
  }

  /** The options both fields share, from the attributes. */
  protected commonOptions(): CommonFieldOptions {
    return {
      size: this.#num("size"),
      variant: (this.getAttribute("variant") as IconVariant | null) ?? undefined,
      solid: this.#bool("solid"),
      strokeWidth: this.#num("stroke-width"),
      absoluteStroke: this.#bool("absolute-stroke"),
      accentColor: this.getAttribute("accent-color") ?? undefined,
    };
  }

  #mirror(name: string): void {
    const value = this.getAttribute(name);
    if (value == null) this.#input!.removeAttribute(name);
    else this.#input!.setAttribute(name, value);
  }

  #label(): void {
    const label = this.getAttribute("label");
    if (label == null) this.#input!.removeAttribute("aria-label");
    else this.#input!.setAttribute("aria-label", label);
  }

  #num(attr: string): number | undefined {
    const raw = this.getAttribute(attr);
    if (raw == null || raw === "") return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  }

  #bool(attr: string): boolean | undefined {
    if (!this.hasAttribute(attr)) return undefined;
    return this.getAttribute(attr) !== "false";
  }
}
```

Apply this change to `packages/element/src/TacetTextFieldElement.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/element/src/TacetTextFieldElement.ts b/packages/element/src/TacetTextFieldElement.ts
index 6043d34..44d4776 100644
--- a/packages/element/src/TacetTextFieldElement.ts
+++ b/packages/element/src/TacetTextFieldElement.ts
@@ -1,111 +1,17 @@
 // <tacet-text-field> — a text field that draws what is typed in the Tacet
-// capitals, for projects without React.
-//
-// The element is the field; a real <input> lives inside it, in the light DOM,
-// so it keeps the focus, the caret, the selection and its place in a form, and
-// its `input` and `change` events bubble out of the element as they are. The
-// input's attributes are mirrored from the element's; `value` reads and writes
-// the input.
+// capitals, for projects without React. The input inside, its attributes and
+// `value` are the ones every field shares (TacetFieldElement.ts).
 
-import {
-  createTextField,
-  type IconVariant, type TextFieldController, type TextOptions, type TextTransition,
-} from "tacet-core";
+import { createTextField, type TextFieldController, type TextOptions, type TextTransition } from "tacet-core";
+import { TacetFieldElement } from "./TacetFieldElement.js";
 
-/** Attributes handed straight to the inner input. */
-const MIRRORED = ["placeholder", "name", "maxlength", "disabled", "readonly", "autocomplete", "inputmode", "required"] as const;
-
-export class TacetTextFieldElement extends HTMLElement {
-  static observedAttributes = [
-    "value", "label", ...MIRRORED,
-    "size", "variant", "solid", "stroke-width", "absolute-stroke", "accent-color", "transition",
-  ];
-
-  #input: HTMLInputElement | null = null;
-  #field: TextFieldController | null = null;
-
-  connectedCallback(): void {
-    if (!this.#input) {
-      this.#input = this.querySelector("input") ?? document.createElement("input");
-      if (!this.#input.isConnected) {
-        this.#input.value = this.getAttribute("value") ?? "";
-        this.appendChild(this.#input);
-      }
-    }
-    for (const name of MIRRORED) this.#mirror(name);
-    this.#label();
-    this.#field = createTextField(this, this.#opts());
-  }
-
-  disconnectedCallback(): void {
-    this.#field?.destroy();
-    this.#field = null;
-  }
-
-  attributeChangedCallback(name: string): void {
-    if (!this.#input) return;
-    if (name === "value") {
-      this.#input.value = this.getAttribute("value") ?? "";
-      this.#field?.refresh();
-    } else if (name === "label") this.#label();
-    else if ((MIRRORED as readonly string[]).includes(name)) this.#mirror(name);
-    else this.#field?.update(this.#opts());
-  }
-
-  /** What is typed in the field. */
-  get value(): string {
-    return this.#input?.value ?? this.getAttribute("value") ?? "";
-  }
-
-  set value(next: string) {
-    if (!this.#input) {
-      this.setAttribute("value", next);
-      return;
-    }
-    this.#input.value = next;
-    this.#field?.refresh();
-  }
-
-  /** The input inside, for focus and selection from code. */
-  get input(): HTMLInputElement | null {
-    return this.#input;
-  }
-
-  #mirror(name: string): void {
-    const value = this.getAttribute(name);
-    if (value == null) this.#input!.removeAttribute(name);
-    else this.#input!.setAttribute(name, value);
-  }
-
-  #label(): void {
-    const label = this.getAttribute("label");
-    if (label == null) this.#input!.removeAttribute("aria-label");
-    else this.#input!.setAttribute("aria-label", label);
-  }
-
-  #num(attr: string): number | undefined {
-    const raw = this.getAttribute(attr);
-    if (raw == null || raw === "") return undefined;
-    const value = Number(raw);
-    return Number.isFinite(value) ? value : undefined;
-  }
-
-  #bool(attr: string): boolean | undefined {
-    if (!this.hasAttribute(attr)) return undefined;
-    return this.getAttribute(attr) !== "false";
+export class TacetTextFieldElement extends TacetFieldElement<TextOptions> {
+  protected create(field: HTMLElement, opts: TextOptions): TextFieldController {
+    return createTextField(field, opts);
   }
 
-  /** Every option, present or not: a removed attribute gives the option back. */
-  #opts(): TextOptions {
-    return {
-      size: this.#num("size"),
-      variant: (this.getAttribute("variant") as IconVariant | null) ?? undefined,
-      solid: this.#bool("solid"),
-      strokeWidth: this.#num("stroke-width"),
-      absoluteStroke: this.#bool("absolute-stroke"),
-      accentColor: this.getAttribute("accent-color") ?? undefined,
-      transition: (this.getAttribute("transition") as TextTransition | null) ?? undefined,
-    };
+  protected options(): TextOptions {
+    return { ...this.commonOptions(), transition: (this.getAttribute("transition") as TextTransition | null) ?? undefined };
   }
 }
 
```

Apply this change to `packages/element/src/index.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/packages/element/src/index.ts b/packages/element/src/index.ts
index c6220df..d15aa2b 100644
--- a/packages/element/src/index.ts
+++ b/packages/element/src/index.ts
@@ -1,23 +1,26 @@
-// tacet-element — <tacet-icon>, <tacet-digits>, <tacet-text> and
-// <tacet-text-field> for projects without React.
+// tacet-element — <tacet-icon>, <tacet-digits>, <tacet-text>,
+// <tacet-text-field> and <tacet-digits-field> for projects without React.
 //
 // Importing the package registers the elements on its own: in markup that is
 // usually what people expect. Need a different tag — call defineTacetIcon("my-icon"),
-// defineTacetDigits("my-number"), defineTacetText("my-text") or
-// defineTacetTextField("my-field").
+// defineTacetDigits("my-number"), defineTacetText("my-text"),
+// defineTacetTextField("my-field") or defineTacetDigitsField("my-count").
 
 import { defineTacetIcon } from "./TacetIconElement.js";
 import { defineTacetDigits } from "./TacetDigitsElement.js";
 import { defineTacetText } from "./TacetTextElement.js";
 import { defineTacetTextField } from "./TacetTextFieldElement.js";
+import { defineTacetDigitsField } from "./TacetDigitsFieldElement.js";
 
 export { TacetIconElement, defineTacetIcon } from "./TacetIconElement.js";
 export { TacetDigitsElement, defineTacetDigits } from "./TacetDigitsElement.js";
 export { TacetTextElement, defineTacetText } from "./TacetTextElement.js";
 export { TacetTextFieldElement, defineTacetTextField } from "./TacetTextFieldElement.js";
+export { TacetDigitsFieldElement, defineTacetDigitsField } from "./TacetDigitsFieldElement.js";
 export { iconNames, hasIcon, reverse, strokeOnScreen, ACCENT_VAR } from "tacet-core";
 
 defineTacetIcon();
 defineTacetDigits();
 defineTacetText();
 defineTacetTextField();
+defineTacetDigitsField();
```

- [ ] **Step 5: Run the test again**

Run: `pnpm build && npx vitest run packages/element/src/parity.test.ts`
Expected: PASS — `Tests  30 passed (30)`.

- [ ] **Step 6: Full check**

Run: `pnpm build && pnpm typecheck && pnpm test`
Expected: build and typecheck without errors, `Tests  284 passed (284)`.

- [ ] **Step 7: Commit**

```bash
git add packages/element/src/TacetDigitsFieldElement.ts packages/element/src/TacetFieldElement.ts packages/element/src/TacetTextFieldElement.ts packages/element/src/index.ts packages/element/src/parity.test.ts
git commit -m "TACET-68: <tacet-digits-field>, on the element <tacet-text-field> stands on"
```

Push the branch and open a PR whose description starts with https://taskless.ru/app/smurov/tasks/TACET-68.

---

### Task 5: The quantity field on the site (TACET-69)

The quantity card of the digits section drew each typed digit as a `<tacet-digits>` of its own over a hidden input, with a CSS caret pinned to the end. It becomes a `<tacet-digits-field>` of size 30 holding «24», with `inputmode="numeric"`, `maxlength="6"` and `label="Quantity"`. The script that fed the old field and the `.field*` styles go; `.digits-field` gives the box its 54 px height, background and focus ring. The transition and variant chips of the section reach the field. The code sample under the demos shows `DigitsField` and `<tacet-digits-field>`.

**Files:**
- Modify: `site/build.ts`, `site/styles.css`

**Interfaces:**
- Consumes: `<tacet-digits-field>` from Task 4: the site serves `packages/element/dist`.
- Produces: nothing later tasks use.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull
git switch -c tacet-69-site-digits-field
```

- [ ] **Step 2: Make the change**

Apply this change to `site/build.ts` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/site/build.ts b/site/build.ts
index b556035..4bbfb2e 100644
--- a/site/build.ts
+++ b/site/build.ts
@@ -383,15 +383,14 @@ const spec = renderSpec("rocket", { size: 24 });
       </div>
       <div class="card digits-demo">
         <span class="label">quantity</span>
-        <label class="field">
-          <span class="field-digits" id="d-field-digits"></span><span class="field-caret"></span>
-          <input id="d-field" type="text" inputmode="numeric" maxlength="6" aria-label="Quantity">
-        </label>
+        <tacet-digits-field id="d-field" class="digits-field" size="30" value="24" inputmode="numeric" maxlength="6" label="Quantity"></tacet-digits-field>
       </div>
     </div>
     <pre class="digits-code"><code>${highlight(`<Digits value={unread} size={16} />
 <Digits value="12:30" transition="relay" />
-<tacet-digits value="1248" size="40"></tacet-digits>`, "html")}</code></pre>
+<DigitsField defaultValue="1" inputMode="numeric" />
+<tacet-digits value="1248" size="40"></tacet-digits>
+<tacet-digits-field name="qty" inputmode="numeric"></tacet-digits-field>`, "html")}</code></pre>
   </div>
 </section>
 
@@ -708,7 +707,7 @@ function dress(el) {
   el.setAttribute("variant", digitsLook === "solid" ? "D" : digitsLook);
   el.toggleAttribute("solid", digitsLook === "solid");
 }
-const dressAll = () => document.querySelectorAll("#digits tacet-digits").forEach(dress);
+const dressAll = () => document.querySelectorAll("#digits tacet-digits, #digits tacet-digits-field").forEach(dress);
 chips("digits-transition", ["morph", "relay", "erase"], () => digitsTransition, (v) => { digitsTransition = v; }, null, dressAll);
 chips("digits-variant", ["A", "B", "C", "D", "solid"], () => digitsLook, (v) => { digitsLook = v; }, null, dressAll);
 dressAll();
@@ -812,37 +811,6 @@ otp.addEventListener("input", () => {
 otp.addEventListener("focus", () => { otpBox.classList.add("focus"); markCell(); });
 otp.addEventListener("blur", () => otpBox.classList.remove("focus"));
 
-// The quantity field: every typed digit is a number of its own, appended on the
-// right — a counter grows on the left, a field grows where the caret is.
-const field = document.getElementById("d-field");
-const fieldBox = field.closest(".field");
-const fieldDigits = document.getElementById("d-field-digits");
-let typed = "";
-field.addEventListener("input", () => {
-  const value = field.value.replace(/\D/g, "").slice(0, 6);
-  field.value = value;
-  let same = 0;
-  while (same < typed.length && same < value.length && typed[same] === value[same]) same++;
-  const staying = [...fieldDigits.children].filter((el) => !el.dataset.leaving);
-  staying.slice(same).reverse().forEach((el) => {
-    el.dataset.leaving = "1";
-    el.setAttribute("value", "");
-    setTimeout(() => el.remove(), 600);
-  });
-  [...value.slice(same)].forEach((digit, i) => {
-    const el = document.createElement("tacet-digits");
-    el.setAttribute("size", "30");
-    dress(el);
-    fieldDigits.appendChild(el);
-    setTimeout(() => el.setAttribute("value", digit), 60 * i);
-  });
-  typed = value;
-});
-const toEnd = () => field.setSelectionRange(field.value.length, field.value.length);
-["click", "keyup", "select"].forEach((type) => field.addEventListener(type, toEnd));
-field.addEventListener("focus", () => { fieldBox.classList.add("focus"); toEnd(); });
-field.addEventListener("blur", () => fieldBox.classList.remove("focus"));
-
 // ── digit wall ──
 // The background of the digits section: faint digits under the heading, the
 // text and the demos. The digits near the pointer light up, each one whole and
```

Apply this change to `site/styles.css` (the block is a patch against the previous task; `git apply` takes it as is):

```diff
diff --git a/site/styles.css b/site/styles.css
index 604b072..989bd52 100644
--- a/site/styles.css
+++ b/site/styles.css
@@ -379,19 +379,13 @@ h2 .anchor { color: inherit; text-decoration: none; }
 .otp-cells { display: flex; gap: 8px; }
 .otp-cell { width: 42px; height: 54px; border-radius: 10px; background: var(--sunken); display: grid; place-items: center; }
 .otp.focus .otp-cell.on { box-shadow: 0 0 0 2px var(--accent); }
-.otp input, .field input {
+.otp input {
   position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0;
   font-size: 16px; border: 0; padding: 0; cursor: text;
 }
-.field {
-  position: relative; display: flex; align-items: center; height: 54px; max-width: 260px;
-  padding: 0 16px; border-radius: 10px; background: var(--sunken);
-}
-.field.focus { box-shadow: 0 0 0 2px var(--accent); }
-.field-digits { display: flex; align-items: center; }
-.field-caret { width: 1.5px; height: 24px; margin-left: 2px; background: var(--ink); visibility: hidden; animation: caret 1s steps(1) infinite; }
-.field.focus .field-caret { visibility: visible; }
-@keyframes caret { 50% { opacity: 0; } }
+/* The field draws its own digits, caret and selection; the box is ours. */
+.digits-field { display: block; height: 54px; max-width: 260px; border-radius: 10px; background: var(--sunken); }
+.digits-field[data-focused] { box-shadow: 0 0 0 2px var(--accent); }
 .digits-code {
   margin-top: 18px; background: var(--sunken); border-radius: 10px; padding: 13px 15px;
   white-space: pre-wrap; word-break: break-word;
```

- [ ] **Step 3: Build and check**

Run: `pnpm build && pnpm svg && pnpm meta && (cd site && node build.ts)`
Expected: `site built → …` and `page 58 KB, icons 454`.

Run `python3 -m http.server 8765 --directory site/dist` and check `http://localhost:8765/#digits` at 1280 px and at 375 px:
- the quantity card shows «24» in the digits, in a sunken box 54 px high;
- a click at the end puts the accent caret there; typing `5a7` gives «2457» — the letter never gets in;
- ArrowLeft, then Shift + ArrowLeft twice selects «45» with the accent plate; typing `0` gives «207»: the 4 turns into the 0, the 5 erases, the 7 moves up after it;
- the «relay» chip sets `transition="relay"` on the field;
- the section's height and the position of `#letters` are the same right after load and 2.5 s later;
- at 375 px `document.documentElement.scrollWidth <= document.documentElement.clientWidth` in the console is `true`;
- the verification code, the clock and the counter work as before; no errors in the console.

Take screenshots of the demos with the caret and with the selection at both widths and attach them to TACET-69.

- [ ] **Step 4: Full check**

Run: `pnpm build && pnpm typecheck && pnpm test`
Expected: build and typecheck without errors, `Tests  284 passed (284)`.

- [ ] **Step 5: Commit**

```bash
git add site/build.ts site/styles.css
git commit -m "TACET-69: the quantity field on the site is <tacet-digits-field>"
```

Push the branch and open a PR whose description starts with https://taskless.ru/app/smurov/tasks/TACET-69.

---

### Task 6: Documentation (TACET-70)

The root README shows `DigitsField` and `<tacet-digits-field>` next to `Digits`, says what the input keeps and that a phone keypad has no colon, and names the order a field changes in; the package table lists every component. The core, React and element READMEs document the field beside its text twin.

**Files:**
- Modify: `README.md`, `packages/core/README.md`, `packages/element/README.md`, `packages/react/README.md`

**Interfaces:**
- Consumes: the names from Tasks 2–4.
- Produces: nothing later tasks use.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull
git switch -c tacet-70-docs
```

- [ ] **Step 2: Write the documentation**

Apply this change to `README.md` (the block is a patch against the previous task; `git apply` takes it as is):

````diff
diff --git a/README.md b/README.md
index a9b31c6..9853cb2 100644
--- a/README.md
+++ b/README.md
@@ -87,10 +87,10 @@ Synonyms are bilingual, so search finds `trash` by both "delete" and «удал
 
 | Package | What for |
 |---|---|
-| [`tacet-react`](packages/react) | React components, `Icon` and `Digits`. React stays a peer dependency |
+| [`tacet-react`](packages/react) | React components: `Icon`, `Digits`, `Text`, `TextField` and `DigitsField`. React stays a peer dependency |
 | [`tacet-native`](packages/native) | React Native component, drawn with react-native-svg |
 | [`tacet-core`](packages/core) | Data and engine. No dependencies at all |
-| [`tacet-element`](packages/element) | `<tacet-icon>`, `<tacet-digits>`, `<tacet-text>` and `<tacet-text-field>` custom elements |
+| [`tacet-element`](packages/element) | `<tacet-icon>`, `<tacet-digits>`, `<tacet-text>`, `<tacet-text-field>` and `<tacet-digits-field>` custom elements |
 
 The wrappers are thin: they call `renderSpec()` from the core and know nothing
 about geometry. A test compares the DOM the web ones produce across all 454
@@ -148,14 +148,16 @@ move, the ones place first; a number that grows draws its new digits in, one
 that shrinks erases the old ones and gives the room back.
 
 ```jsx
-import { Digits } from "tacet-react";
+import { Digits, DigitsField } from "tacet-react";
 
 <Digits value={unread} size={16} />
 <Digits value="12:30" transition="relay" />
+<DigitsField defaultValue="1" inputMode="numeric" />
 ```
 
 ```html
 <tacet-digits value="1248" size="40"></tacet-digits>
+<tacet-digits-field name="qty" inputmode="numeric"></tacet-digits-field>
 ```
 
 Three transitions: `morph`, the default, flows one contour into the other;
@@ -163,11 +165,18 @@ Three transitions: `morph`, the default, flows one contour into the other;
 old digit and writes the new one. A number shows 0–9 and `:`, and its digits sit
 on a tabular grid, so a counter does not jiggle as it ticks.
 
+`DigitsField` is the letters' `TextField` with digits: the same real `<input>`
+inside, the same caret and selection. The input keeps the digits and the colon
+only, and whatever else is typed or pasted is taken out at once. A digit that
+gives way to a digit turns into it by the field's transition; a digit that goes
+erases where it stands, and only then the rest moves up. For a phone keypad set
+`inputmode="numeric"` — it has no colon, so a time needs the full keyboard.
+
 The accent of a digit is a stretch of its contour — `accentSpans`, the same
 `[start%, width%]` pairs as cuts — painted in variants C and D.
 
-React Native has the digit glyphs, accent included. The animated number is web
-only for now.
+React Native has the digit glyphs, accent included. The animated number and the
+field are web only for now.
 
 ## Letters
 
@@ -207,7 +216,9 @@ digits a colon stands centred, the way a clock has it.
 `TextField` draws what is typed in the same letters. A real `<input>` sits
 inside and keeps the focus, the caret, the selection, copy and paste and its
 place in a form; without scripts the field is a plain input. The caret is a
-stroke in the accent colour, a selection is a plate of the accent.
+stroke in the accent colour, a selection is a plate of the accent. What was
+deleted erases where it stands, then the rest of the line moves up, then the new
+letters write themselves in.
 
 React Native has the letter glyphs; the line and the field are web only for now.
 
````

Apply this change to `packages/core/README.md` (the block is a patch against the previous task; `git apply` takes it as is):

````diff
diff --git a/packages/core/README.md b/packages/core/README.md
index 18ae1a2..3ae02d7 100644
--- a/packages/core/README.md
+++ b/packages/core/README.md
@@ -160,6 +160,20 @@ field drawn in the same letters: the input keeps the focus, the caret, the
 selection and its place in a form, and the field draws the letters, a caret and
 a selection over it. Call `refresh()` after setting `input.value` from code.
 
+`createDigitsField(field, opts)` is the same field with digits, and takes the
+options of `createDigits`. The input keeps the digits and the colon only: what
+else gets in is taken out at once, written the way typing writes it, so a
+framework watching the input sees the cleaned value.
+
+```js
+import { createDigitsField } from "tacet-core";
+
+const field = createDigitsField(document.getElementById("qty"), { size: 30 });
+field.refresh();                    // after setting input.value from code
+field.update({ transition: "relay" });
+field.destroy();                    // gives the input its own look back
+```
+
 ## Data and semantics
 
 ```js
````

Apply this change to `packages/element/README.md` (the block is a patch against the previous task; `git apply` takes it as is):

````diff
diff --git a/packages/element/README.md b/packages/element/README.md
index 1083414..ad6c032 100644
--- a/packages/element/README.md
+++ b/packages/element/README.md
@@ -139,6 +139,17 @@ A real `<input>` lives inside, in the light DOM: it takes part in forms, and its
 attributes are those of `<tacet-text>`. The `value` property reads and writes
 the input. For another tag call `defineTacetTextField("my-field")`.
 
+## `<tacet-digits-field>`
+
+```html
+<tacet-digits-field name="qty" inputmode="numeric" size="30"></tacet-digits-field>
+```
+
+`<tacet-text-field>` for numbers, with the same attributes; `transition` is that
+of `<tacet-digits>`. The input keeps the digits and the colon only, and its
+`input` event bubbles out with what the field kept. For another tag call
+`defineTacetDigitsField("my-count")`.
+
 ## In code
 
 ```js
````

Apply this change to `packages/react/README.md` (the block is a patch against the previous task; `git apply` takes it as is):

````diff
diff --git a/packages/react/README.md b/packages/react/README.md
index b549385..6a6f818 100644
--- a/packages/react/README.md
+++ b/packages/react/README.md
@@ -190,6 +190,18 @@ Every prop an `<input>` takes goes to the input inside, and so does the `ref`;
 `accentColor`, `strokeWidth`, `absoluteStroke` and `transition` set how the
 letters look. Until the script runs the field is a plain input.
 
+## DigitsField
+
+```jsx
+import { DigitsField } from "tacet-react";
+
+<DigitsField value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" />
+```
+
+`TextField` for numbers, with the same props; `transition` is that of `Digits`:
+`morph`, `relay` or `erase`. The input keeps the digits and the colon only, so
+`onChange` gets what the field kept of what was typed.
+
 ## Also exported
 
 ```js
````

- [ ] **Step 3: Check the documentation**

Run: `grep -c 'DigitsField\|digits-field\|createDigitsField' README.md packages/core/README.md packages/react/README.md packages/element/README.md`
Expected: `README.md:6`, `packages/core/README.md:3`, `packages/react/README.md:3`, `packages/element/README.md:3`.

- [ ] **Step 4: Commit**

```bash
git add README.md packages/core/README.md packages/element/README.md packages/react/README.md
git commit -m "TACET-70: documentation for the digits field"
```

Push the branch and open a PR whose description starts with https://taskless.ru/app/smurov/tasks/TACET-70.

---

### Task 7: Release 0.4.0 (TACET-71)

Every step that leaves the machine — push, tag, deploy — waits for Ilya's word.

- [ ] **Step 1: Everything is merged**

Run: `git switch main && git pull && pnpm build && pnpm typecheck && pnpm test`
Expected: all green on `main`, `Tests  284 passed (284)`.

- [ ] **Step 2: Versions and descriptions**

In `packages/core/package.json`, `packages/react/package.json`, `packages/element/package.json` and `packages/native/package.json` change `"version": "0.3.1"` to `"version": "0.4.0"`. Replace the descriptions of two of them:

| Package | New `description` |
| --- | --- |
| `react` | `Tacet icon set for React: 454 outline glyphs where the cut is data, self-drawing animation, four cut densities, 64 musical instruments, digits and a text line that write themselves, and input fields drawn in the same glyphs.` |
| `element` | `Tacet icon set as custom elements: <tacet-icon>, <tacet-digits>, <tacet-text>, <tacet-text-field> and <tacet-digits-field> for any stack without React. 454 outline glyphs with self-drawing animation.` |

`core` and `native` keep theirs.

```bash
git add packages/*/package.json
git commit -m "TACET-71: release 0.4.0 — a field for numbers"
```

- [ ] **Step 3: Publish (on Ilya's word)**

```bash
git push origin main
git tag v0.4.0
git push origin v0.4.0
```

The `publish` workflow builds, typechecks, tests, packs with pnpm and publishes with npm through OIDC. Wait for it: `gh run watch` in the repo.

Run: `npm view tacet-core version --prefer-online && npm view tacet-react version --prefer-online && npm view tacet-element version --prefer-online && npm view tacet-native version --prefer-online`
Expected: `0.4.0` four times. The registry can lag a minute or two behind the workflow; repeat before deciding something is wrong.

- [ ] **Step 4: Deploy the site (on Ilya's word)**

Run: `pnpm run deploy`
Expected: `done: https://tacet.smurov.com — page 200, modules 200 at ./tacet/<hash>/core/index.js`.

- [ ] **Step 5: Check the live site**

Run: `curl -s https://tacet.smurov.com | grep -c 'id="d-field" class="digits-field"'`
Expected: `1`.

Open https://tacet.smurov.com/#digits at 1280 and 375 px and go through the checklist of Task 5 Step 3 on the live site, with a cold cache (a private window) and a warm one. Attach the screenshots to TACET-64 and close the epic after Ilya has seen the field.
