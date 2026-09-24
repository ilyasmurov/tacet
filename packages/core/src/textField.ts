// A text field that draws what is typed in the Tacet capitals.
//
// The field holds a real <input>: invisible, but it has the focus. The caret,
// the selection with Shift and the arrows, copy, paste, undo, input methods and
// autofill are the input's own, and so is its place in a form. What the field
// draws — the letters, the caret, the selection — comes from the Text layout,
// never from the input's font, so it cannot drift away from the letters. A
// click lands on the nearest boundary between glyphs, kerning included.
//
// One character of the input is one glyph of the field: the caret index in the
// input is the index in the layout. So the replacements are one to one — a
// straight quote becomes a guillemet by where it stands, an apostrophe the
// typographic one, any whitespace a space — and a character the set has no
// glyph for is drawn as an empty box, so it can be seen and stepped over.
//
// Chosen on the demo of 24.09.2026: the caret is a stroke in the accent colour,
// as thick as the letters; the selection is a plate of the accent at 20%.

import { ACCENT_VAR } from "./renderSpec.js";
import { insetFor, normalizeSize, strokeOnScreen } from "./stroke.js";
import { glyphForChar } from "./textChars.js";
import { SPACE_ADVANCE, glyphMarkup, layoutGlyph } from "./textLayout.js";
import { TEXT_TIMING, canAnimate, eraseOut, fromMarkup, run, writeIn, type Flight, type TextOptions } from "./text.js";

export interface TextFieldController {
  /** Draw the input's value again — after setting `input.value` from code. */
  refresh(): void;
  /** New options. Anything that changes the drawing redraws the field at once. */
  update(opts: TextOptions): void;
  /** Stop listening, remove what the field drew, give the input its own look back. */
  destroy(): void;
}

/** Timings of the caret, ms: a soft pulse, still while typing and for a moment after. */
export const CARET_TIMING = { pulse: 1200, rest: 500 } as const;

/** Advance of a character the set cannot draw, glyph units: an empty box stands in for it. */
const TOFU_ADVANCE = 9;
const EASE_SLIDE = "cubic-bezier(.3,.7,.2,1)";

/**
 * What the field draws for each character of the input, one to one: a
 * character Text draws, " " for any whitespace, or null for one it cannot.
 */
export function fieldChars(value: string): (string | null)[] {
  const out: (string | null)[] = [];
  for (let i = 0; i < value.length; i++) {
    const raw = value[i]!;
    if (/\s/.test(raw)) out.push(" ");
    else if (raw === '"') out.push(i === 0 || /[\s(]/.test(value[i - 1]!) ? "«" : "»");
    else if (raw === "'") out.push("’");
    else {
      const up = raw.toUpperCase();
      out.push(up.length === 1 && glyphForChar(up) ? up : null);
    }
  }
  return out;
}

/** One character of the field as laid out, in pixels. */
interface Cell {
  key: string;
  el: SVGSVGElement | null;
  x: number;
  w: number;
}

const SVGNS = "http://www.w3.org/2000/svg";
const px = (n: number) => `${Math.round(n * 100) / 100}px`;

/**
 * Takes over `field` — an element with an `<input>` inside — and draws the
 * input's value in the Tacet capitals, with a caret and a selection of its own.
 */
export function createTextField(field: HTMLElement, opts: TextOptions = {}): TextFieldController {
  const input = field.querySelector("input");
  if (!input) throw new Error("tacet: createTextField needs an <input> inside the field");
  let options: TextOptions = { ...opts };
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
  const geometry = () => {
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

  /** The layout of the value, one cell per character of the input. */
  const layout = (value: string): { chars: (string | null)[]; glyphs: (ReturnType<typeof layoutGlyph> | null)[]; xs: number[]; ws: number[] } => {
    const { unit } = geometry();
    const chars = fieldChars(value);
    const glyphs: (ReturnType<typeof layoutGlyph> | null)[] = [];
    const xs: number[] = [];
    const ws: number[] = [];
    let x = 0;
    let runStart = 0;
    chars.forEach((ch, i) => {
      if (ch === null || ch === " ") {
        glyphs.push(null);
        xs.push(x);
        const w = (ch === " " ? SPACE_ADVANCE : TOFU_ADVANCE) * unit;
        ws.push(w);
        x += w;
        runStart = i + 1;
        return;
      }
      // Kerning within a run of glyphs, as in a word of Text.
      let end = i;
      while (end + 1 < chars.length && chars[end + 1] !== null && chars[end + 1] !== " ") end++;
      const run_ = chars.slice(runStart, end + 1) as string[];
      const glyph = layoutGlyph(run_, i - runStart, options);
      glyphs.push(glyph);
      xs.push(x);
      const w = Number(glyph.svgAttrs["width"]);
      ws.push(w);
      x += w;
    });
    return { chars, glyphs, xs, ws };
  };

  const tofu = (w: number) => {
    const { size, capTop, capBottom } = geometry();
    const stroke = strokeOnScreen(size, options);
    const svg = document.createElementNS(SVGNS, "svg");
    for (const [key, value] of Object.entries({ width: w, height: size, "aria-hidden": "true", class: "tc-tofu" })) svg.setAttribute(key, String(value));
    svg.style.overflow = "visible";
    const rect = document.createElementNS(SVGNS, "rect");
    const inset = w * 0.2;
    for (const [key, value] of Object.entries({
      x: inset, y: capTop, width: w - 2 * inset, height: capBottom - capTop, rx: stroke, fill: "none",
      stroke: "currentColor", "stroke-width": stroke, opacity: 0.45,
    })) rect.setAttribute(key, String(value));
    svg.appendChild(rect);
    return svg;
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
    const { chars, glyphs, xs, ws } = layout(value);
    cells = chars.map((ch, i) => {
      const key = ch ?? "\u0000";
      let el: SVGSVGElement | null = null;
      if (glyphs[i]) el = fromMarkup(glyphMarkup(glyphs[i]!)) as SVGSVGElement;
      else if (ch === null) el = tofu(ws[i]!) as SVGSVGElement;
      if (el) {
        place(el, xs[i]!);
        stage.appendChild(el);
      }
      return { key, el, x: xs[i]!, w: ws[i]! };
    });
    drawn = value;
    placeholder();
    marksFor = "";
    paintMarks();
  };

  /** The placeholder, drawn in the same letters at 40%, while the field is empty. */
  const placeholder = () => {
    stage.querySelector(".tc-placeholder")?.remove();
    const text = input.value ? "" : input.placeholder;
    if (!text) return;
    const { chars, glyphs, xs } = layout(text);
    const hint = document.createElement("span");
    hint.className = "tc-placeholder";
    hint.setAttribute("style", "position:absolute;left:0;top:0;opacity:.4");
    chars.forEach((_, i) => {
      const glyph = glyphs[i];
      if (!glyph) return;
      const el = fromMarkup(glyphMarkup(glyph));
      place(el, xs[i]!);
      hint.appendChild(el);
    });
    stage.insertBefore(hint, stage.firstChild);
  };

  /** Draws `value` with the transition: the common head and tail stay, the rest erases and writes itself in. */
  const change = (value: string) => {
    if (!canAnimate()) {
      redraw(value);
      return;
    }
    settle();
    const { chars, glyphs, xs, ws } = layout(value);
    const keys = chars.map((ch) => ch ?? "\u0000");
    const old = cells;
    const kind = options.transition ?? "erase";
    let head = 0;
    let tail = 0;
    if (kind !== "rewrite") {
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

    for (const cell of gone) {
      if (!cell.el) continue;
      const el = cell.el;
      if (kind === "append") el.remove();
      else {
        landing.push(el.classList.contains("tc-tofu") ? Promise.resolve() : eraseOut(flight, el));
        cleanups.push(() => el.remove());
      }
    }

    const lag = kind !== "append" && gone.some((cell) => cell.el) ? TEXT_TIMING.lag : 0;
    cells = keys.map((key, i) => {
      const kept = i < head ? old[i] : i >= keys.length - tail ? old[old.length - (keys.length - i)] : undefined;
      if (kept) {
        if (kept.el) {
          const from = kept.x;
          place(kept.el, xs[i]!);
          if (glyphs[i]) kept.el.setAttribute("viewBox", String(glyphs[i]!.svgAttrs["viewBox"]));
          if (glyphs[i]) kept.el.setAttribute("width", String(glyphs[i]!.svgAttrs["width"]));
          if (kind !== "append" && from !== xs[i]) {
            landing.push(run(flight, kept.el, [{ left: px(from) }, { left: px(xs[i]!) }], TEXT_TIMING.slide, 0, EASE_SLIDE));
          }
        }
        return { key, el: kept.el, x: xs[i]!, w: ws[i]! };
      }
      let el: SVGSVGElement | null = null;
      if (glyphs[i]) {
        el = fromMarkup(glyphMarkup(glyphs[i]!)) as SVGSVGElement;
        place(el, xs[i]!);
        stage.appendChild(el);
        const svg = el;
        landing.push(writeIn(flight, svg, lag));
        cleanups.push(() => {
          svg.querySelector("mask")?.remove();
          svg.querySelector("g.tc-body")?.removeAttribute("mask");
        });
      } else if (key === "\u0000") {
        el = tofu(ws[i]!) as SVGSVGElement;
        place(el, xs[i]!);
        stage.appendChild(el);
      }
      return { key, el, x: xs[i]!, w: ws[i]! };
    });
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
    while (a > 0 && !/\s/.test(v[a - 1]!)) a--;
    while (b < v.length && !/\s/.test(v[b]!)) b++;
    select(a, b);
  };
  const onClick = (event: MouseEvent) => {
    if (event.detail === 3) select(0, input.value.length);
  };
  const onInput = () => change(input.value);
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
  redraw(input.value);

  return {
    refresh() {
      if (input.value !== drawn) change(input.value);
      else paintMarks();
    },
    update(next) {
      options = { ...options, ...next };
      placeLayer();
      redraw(input.value);
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
