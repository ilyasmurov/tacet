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
