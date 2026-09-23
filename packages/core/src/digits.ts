// A number that changes: the live controller.
//
// Works on plain DOM, like animate.ts, so the React component and
// <tacet-digits> stay thin wrappers. The host holds one svg per character — the
// same DOM digitsMarkup describes — and only the slots whose character changed
// animate, the ones place first.

import { accentDash } from "./accent.js";
import { prefersReducedMotion } from "./animate.js";
import {
  SLOT_ATTRS, digitGeometry, parseDigits, slotSpec,
  type DigitsRenderOpts, type DigitsTransition, type SlotSpec,
} from "./digitsLayout.js";
import { easeInOutCubic, lerpInto, pairUp, pointsToPath, sampleContour, unpair, type Pair4 } from "./morph.js";
import { BODY_CLASS, type ElementSpec } from "./renderSpec.js";
import { dashFor } from "./stroke.js";

const SVGNS = "http://www.w3.org/2000/svg";

export interface DigitsOptions extends DigitsRenderOpts {
  /** How one digit turns into another. Defaults to "morph". */
  transition?: DigitsTransition | undefined;
}

export interface DigitsController {
  /** What the number shows, unsupported characters dropped. */
  readonly value: string;
  /** Show a new value: the digits that changed animate. */
  set(value: string | number): void;
  /** New options. Anything that changes the drawing redraws the number at once. */
  update(opts: DigitsOptions): void;
  /** Stop every animation and leave the number drawn still. */
  destroy(): void;
}

/** Timings, ms — the numbers the live demo settled on, 23.09.2026. */
export const DIGIT_TIMING = {
  morph: 480,
  relayOut: 420,
  relayIn: 560,
  relayLag: 100,
  eraseOut: 260,
  eraseIn: 520,
  appear: 520,
  vanish: 300,
  collapse: 260,
  collapseLag: 140,
  stagger: 70,
} as const;

const EASE_DRAW = "cubic-bezier(.45,0,.2,1)";
const EASE_OUT = "cubic-bezier(.55,0,.8,.4)";
const EASE_RUN = "cubic-bezier(.5,0,.75,.5)";

/**
 * Reveal masks: a dash of 100 and a gap of 120, hidden at an offset of 110. The
 * 20 of slack keeps the round cap of the mask stroke from leaving a dot at the
 * edge of a hidden digit.
 */
const HIDDEN = 110;
const REVEAL_DASH = "100 120";
/** How much wider the mask stroke is than the stroke it uncovers, in glyph units. */
const REVEAL_EXTRA = 0.9;

// A per-instance prefix, as in animate.ts: two copies of the package on a page
// would otherwise hand out the same mask ids.
const MODULE_ID = Math.random().toString(36).slice(2, 7);
let maskCounter = 0;

interface MorphState {
  points: number[];
  cuts: Pair4;
  spans: Pair4 | null;
}

interface Slot {
  char: string;
  svg: SVGSVGElement;
  /** Bumped by every new operation: a stale continuation compares and drops out. */
  token: number;
  animations: Animation[];
  frame: number;
  /** Where a morph in flight is right now — the next morph starts from here. */
  live: MorphState | null;
}

function build(spec: ElementSpec): SVGElement {
  const el = document.createElementNS(SVGNS, spec.tag);
  for (const key of Object.keys(spec.attrs)) el.setAttribute(key, String(spec.attrs[key]));
  return el;
}

function buildBody(parts: ElementSpec[]): SVGGElement {
  const body = document.createElementNS(SVGNS, "g") as SVGGElement;
  body.setAttribute("class", BODY_CLASS);
  for (const part of parts) body.appendChild(build(part));
  return body;
}

/** A slot svg with a still body — the DOM digitsMarkup describes, attribute for attribute. */
function buildSlot(spec: SlotSpec): SVGSVGElement {
  const svg = document.createElementNS(SVGNS, "svg") as SVGSVGElement;
  const attrs: Record<string, string | number> = { ...spec.svgAttrs, ...SLOT_ATTRS };
  for (const key of Object.keys(attrs)) svg.setAttribute(key, String(attrs[key]));
  svg.style.overflow = "visible";
  svg.appendChild(buildBody(spec.parts));
  return svg;
}

/** Whether transitions can play: motion is welcome and the Web Animations API is there. */
function canAnimate(): boolean {
  return !prefersReducedMotion()
    && typeof Element !== "undefined"
    && typeof Element.prototype.animate === "function";
}

function stop(slot: Slot): void {
  slot.token++;
  for (const animation of slot.animations) animation.cancel();
  slot.animations = [];
  if (slot.frame) cancelAnimationFrame(slot.frame);
  slot.frame = 0;
}

/** Draws the slot's character still: exact glyph, no masks, attributes for the current options. */
function drawStill(slot: Slot, opts: DigitsOptions): void {
  const spec = slotSpec(slot.char, opts);
  for (const key of Object.keys(spec.svgAttrs)) slot.svg.setAttribute(key, String(spec.svgAttrs[key]));
  slot.svg.querySelectorAll(`mask, g.${BODY_CLASS}`).forEach((el) => el.remove());
  slot.svg.appendChild(buildBody(spec.parts));
}

/** Stops whatever runs on the slot and leaves its character drawn still. */
function settle(slot: Slot, opts: DigitsOptions): void {
  stop(slot);
  slot.live = null;
  drawStill(slot, opts);
}

/** Plays a dash offset from one value to another; resolves when it lands, never if cancelled. */
function run(
  slot: Slot, el: SVGElement, from: number, to: number, duration: number, delay: number, easing: string,
): Promise<void> {
  return new Promise((resolve) => {
    el.style.strokeDashoffset = String(from);
    const animation = el.animate(
      [{ strokeDashoffset: from }, { strokeDashoffset: to }],
      { duration, delay, easing, fill: "forwards" },
    );
    slot.animations.push(animation);
    animation.addEventListener("finish", () => {
      el.style.strokeDashoffset = String(to);
      animation.cancel();
      resolve();
    }, { once: true });
  });
}

interface Reveal {
  strokes: SVGElement[];
  drop(): void;
}

/**
 * Hangs a reveal mask on a body: white copies of its contours, dashed so that
 * moving the offset uncovers or hides the stroke along its length. The same
 * construction as the draw-in in animate.ts, and for the same reason — the
 * cuts and the accent span keep their own dash untouched.
 */
function reveal(svg: SVGSVGElement, body: SVGGElement, offset: number): Reveal {
  const id = `tc-dig-${MODULE_ID}-${(maskCounter++).toString(36)}`;
  const mask = document.createElementNS(SVGNS, "mask");
  mask.setAttribute("id", id);
  mask.setAttribute("maskUnits", "userSpaceOnUse");
  mask.setAttribute("x", "-3");
  mask.setAttribute("y", "-3");
  mask.setAttribute("width", "30");
  mask.setAttribute("height", "30");

  const strokes: SVGElement[] = [];
  const seen = new Set<string>();
  body.querySelectorAll("path").forEach((part) => {
    // The accent span repeats the contour of its part; one copy uncovers both.
    const d = part.getAttribute("d") ?? "";
    if (seen.has(d)) return;
    seen.add(d);
    const copy = document.createElementNS(SVGNS, "path");
    copy.setAttribute("d", d);
    copy.setAttribute("fill", "none");
    copy.setAttribute("stroke", "#fff");
    copy.setAttribute("stroke-width", String(Number(part.getAttribute("stroke-width") ?? 2) + REVEAL_EXTRA));
    copy.setAttribute("stroke-linecap", "round");
    copy.setAttribute("stroke-linejoin", "round");
    copy.setAttribute("pathLength", "100");
    copy.setAttribute("stroke-dasharray", REVEAL_DASH);
    copy.style.strokeDashoffset = String(offset);
    mask.appendChild(copy);
    strokes.push(copy);
  });

  svg.insertBefore(mask, svg.firstChild);
  body.setAttribute("mask", `url(#${id})`);
  return {
    strokes,
    drop: () => {
      mask.remove();
      body.removeAttribute("mask");
    },
  };
}

const bodyOf = (slot: Slot) => slot.svg.querySelector<SVGGElement>(`g.${BODY_CLASS}`)!;

/** Points the slot at a new character. The attribute moves with it, or the DOM would name the old digit. */
function retarget(slot: Slot, char: string): void {
  slot.char = char;
  slot.svg.setAttribute("data-char", char);
}

function morph(slot: Slot, char: string, delay: number, opts: DigitsOptions): void {
  const target = digitGeometry(char, opts);
  const goalPoints = sampleContour(target.d);
  const current = slot.live ?? (() => {
    const geometry = digitGeometry(slot.char, opts);
    const points = sampleContour(geometry.d);
    return points
      ? { points, cuts: pairUp(geometry.cuts), spans: geometry.spans ? pairUp(geometry.spans) : null }
      : null;
  })();
  if (!goalPoints || !current) {
    // No way to measure a contour here: the digit simply changes.
    retarget(slot, char);
    settle(slot, opts);
    return;
  }

  stop(slot);
  const token = slot.token;
  retarget(slot, char);

  const goal: MorphState = { points: goalPoints, cuts: pairUp(target.cuts), spans: target.spans ? pairUp(target.spans) : null };
  const from: MorphState = {
    points: current.points.slice(),
    cuts: [...current.cuts] as Pair4,
    spans: current.spans ? ([...current.spans] as Pair4) : goal.spans,
  };
  const now: MorphState = { points: from.points.slice(), cuts: [...from.cuts] as Pair4, spans: from.spans ? ([...from.spans] as Pair4) : null };
  slot.live = now;

  // The body is the target's still parts, re-shaped every frame: colour, width
  // and caps are already the right ones, only the contour and the dashes move.
  slot.svg.querySelectorAll(`mask, g.${BODY_CLASS}`).forEach((el) => el.remove());
  const body = buildBody(slotSpec(char, opts).parts);
  slot.svg.appendChild(body);
  const [base, span] = Array.from(body.querySelectorAll("path"));

  const paint = (t: number) => {
    lerpInto(now.points, from.points, goal.points, t);
    lerpInto(now.cuts, from.cuts, goal.cuts, t);
    if (now.spans && from.spans && goal.spans) lerpInto(now.spans, from.spans, goal.spans, t);
    const d = pointsToPath(now.points);
    const cuts = opts.solid ? [] : unpair(now.cuts);
    base?.setAttribute("d", d);
    base?.setAttribute("stroke-dasharray", cuts.length ? dashFor(cuts) : "100 0");
    if (span && now.spans) {
      const accent = accentDash(unpair(now.spans), cuts);
      span.setAttribute("d", d);
      if (accent) {
        span.style.visibility = "";
        span.setAttribute("stroke-dasharray", accent.dash);
        span.setAttribute("stroke-dashoffset", String(accent.offset));
      } else {
        span.style.visibility = "hidden";
      }
    }
  };

  paint(0);
  const start = performance.now() + delay;
  const step = (time: number) => {
    if (token !== slot.token) return;
    const k = Math.min(1, Math.max(0, (time - start) / DIGIT_TIMING.morph));
    paint(easeInOutCubic(k));
    if (k < 1) {
      slot.frame = requestAnimationFrame(step);
      return;
    }
    // The polyline lives only in flight: at rest the slot holds the exact glyph.
    slot.frame = 0;
    slot.live = null;
    drawStill(slot, opts);
  };
  slot.frame = requestAnimationFrame(step);
}

async function relay(slot: Slot, char: string, delay: number, opts: DigitsOptions): Promise<void> {
  // A relay mid-flight finishes at once: the new one starts from a still digit.
  settle(slot, opts);
  const token = slot.token;
  const leaving = bodyOf(slot);
  retarget(slot, char);
  const arriving = buildBody(slotSpec(char, opts).parts);
  slot.svg.appendChild(arriving);

  const out = reveal(slot.svg, leaving, 0);
  const inn = reveal(slot.svg, arriving, HIDDEN);
  const gone = Promise.all(out.strokes.map((s) => run(slot, s, 0, -HIDDEN, DIGIT_TIMING.relayOut, delay, EASE_RUN)));
  const drawn = Promise.all(inn.strokes.map((s) =>
    run(slot, s, HIDDEN, 0, DIGIT_TIMING.relayIn, delay + DIGIT_TIMING.relayLag, EASE_DRAW)));

  await gone;
  if (token !== slot.token) return;
  out.drop();
  leaving.remove();
  await drawn;
  if (token !== slot.token) return;
  inn.drop();
}

async function erase(slot: Slot, char: string, delay: number, opts: DigitsOptions): Promise<void> {
  settle(slot, opts);
  const token = slot.token;
  const old = bodyOf(slot);
  retarget(slot, char);

  const out = reveal(slot.svg, old, 0);
  await Promise.all(out.strokes.map((s) => run(slot, s, 0, HIDDEN, DIGIT_TIMING.eraseOut, delay, EASE_OUT)));
  if (token !== slot.token) return;
  out.drop();
  old.remove();

  const next = buildBody(slotSpec(char, opts).parts);
  slot.svg.appendChild(next);
  const inn = reveal(slot.svg, next, HIDDEN);
  await Promise.all(inn.strokes.map((s) => run(slot, s, HIDDEN, 0, DIGIT_TIMING.eraseIn, 0, EASE_DRAW)));
  if (token !== slot.token) return;
  inn.drop();
}

/** A new leading digit draws itself in. The colon has no contour to draw and just appears. */
async function appear(slot: Slot, delay: number): Promise<void> {
  if (slot.char === ":") return;
  const token = slot.token;
  const inn = reveal(slot.svg, bodyOf(slot), HIDDEN);
  await Promise.all(inn.strokes.map((s) => run(slot, s, HIDDEN, 0, DIGIT_TIMING.appear, delay, EASE_DRAW)));
  if (token !== slot.token) return;
  inn.drop();
}

/** A leading digit that is no longer needed erases itself and gives its room back. */
async function vanish(slot: Slot, opts: DigitsOptions): Promise<void> {
  settle(slot, opts);
  const token = slot.token;
  const width = slot.svg.getAttribute("width");
  const collapse = slot.svg.animate(
    [{ width: `${width}px` }, { width: "0px" }],
    { duration: DIGIT_TIMING.collapse, delay: DIGIT_TIMING.collapseLag, easing: "ease", fill: "forwards" },
  );
  slot.animations.push(collapse);
  const collapsed = new Promise<void>((resolve) => collapse.addEventListener("finish", () => resolve(), { once: true }));

  if (slot.char !== ":") {
    const out = reveal(slot.svg, bodyOf(slot), 0);
    await Promise.all(out.strokes.map((s) => run(slot, s, 0, HIDDEN, DIGIT_TIMING.vanish, 0, EASE_OUT)));
  }
  await collapsed;
  if (token !== slot.token) return;
  slot.svg.remove();
}

const REDRAWN_BY = ["size", "variant", "solid", "accentColor", "strokeWidth", "absoluteStroke"] as const;

/**
 * Takes over `host` and shows `value` in it.
 *
 * Whatever the host held is replaced by the still number — the same DOM
 * digitsMarkup produces, so taking over server-rendered markup does not flash.
 * Without the Web Animations API, or when the user asks for reduced motion, a
 * new value is drawn at once.
 */
export function createDigits(host: Element, value: string | number, opts: DigitsOptions = {}): DigitsController {
  let options: DigitsOptions = { ...opts };
  let chars = parseDigits(value);
  let slots: Slot[] = [];
  const retiring = new Set<Slot>();

  const newSlot = (char: string): Slot => ({
    char, svg: buildSlot(slotSpec(char, options)), token: 0, animations: [], frame: 0, live: null,
  });

  const rebuild = () => {
    for (const slot of [...slots, ...retiring]) stop(slot);
    retiring.clear();
    host.textContent = "";
    slots = chars.split("").map(newSlot);
    for (const slot of slots) host.appendChild(slot.svg);
  };

  const change = (slot: Slot, char: string, delay: number) => {
    // The colon has no contour to morph or draw: a slot switching to or from
    // it just changes.
    if (slot.char === ":" || char === ":") {
      retarget(slot, char);
      settle(slot, options);
      return;
    }
    const kind = options.transition ?? "morph";
    if (kind === "relay") void relay(slot, char, delay, options);
    else if (kind === "erase") void erase(slot, char, delay, options);
    else morph(slot, char, delay, options);
  };

  rebuild();

  return {
    get value() {
      return chars;
    },

    set(next) {
      const text = parseDigits(next);
      if (text === chars) return;
      chars = text;
      if (!canAnimate()) {
        rebuild();
        return;
      }

      const grow = text.length - slots.length;
      if (grow > 0) {
        const added = text.slice(0, grow).split("").map(newSlot);
        const first = slots[0]?.svg ?? null;
        for (const slot of added) host.insertBefore(slot.svg, first);
        added.forEach((slot, i) => void appear(slot, i * DIGIT_TIMING.stagger));
        slots = [...added, ...slots];
      } else if (grow < 0) {
        const gone = slots.slice(0, -grow);
        slots = slots.slice(-grow);
        for (const slot of gone) {
          retiring.add(slot);
          void vanish(slot, options).then(() => retiring.delete(slot));
        }
      }

      // Right to left: the ones place moves first, like a counter rolling over.
      let order = 0;
      for (let i = text.length - 1; i >= Math.max(0, grow); i--) {
        const slot = slots[i]!;
        if (slot.char === text[i]) continue;
        change(slot, text[i]!, order * DIGIT_TIMING.stagger);
        order++;
      }
    },

    update(next) {
      const before = options;
      options = { ...options, ...next };
      if (REDRAWN_BY.some((key) => before[key] !== options[key])) rebuild();
    },

    destroy() {
      rebuild();
    },
  };
}
