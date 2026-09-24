// A line of text that changes: the live controller.
//
// Plain DOM, like digits.ts, so the React component and <tacet-text> stay thin
// wrappers. At rest the host holds exactly what textMarkup produces: word spans
// of glyph svgs with a spacer between the words. When the text changes, the
// common head and tail stay the same elements. What changed in the middle
// erases back along its strokes while its width collapses; the new glyphs grow
// their width and write themselves in, stroke after stroke, in the order a hand
// writes the letter. The tail slides along with those widths — no measuring and
// no absolute positioning, so a text that wraps keeps wrapping like text.

import { prefersReducedMotion } from "./animate.js";
import { BODY_CLASS } from "./renderSpec.js";
import {
  SPACE_CLASS, WORD_CLASS, WORD_STYLE, glyphMarkup, normaliseText, spaceMarkup, spaceStyle, textLayout, textMarkup,
  type TextGlyph, type TextRenderOpts, type TextTransition,
} from "./textLayout.js";

const SVGNS = "http://www.w3.org/2000/svg";

export interface TextOptions extends TextRenderOpts {
  /** How the text changes. Defaults to "erase": the changed middle erases, the new one writes itself in. */
  transition?: TextTransition | undefined;
}

export interface TextController {
  /** The text as drawn: capitals, unsupported characters dropped. */
  readonly value: string;
  /** Show a new text: only the part that changed animates. */
  set(value: string | number): void;
  /** New options. Anything that changes the drawing redraws the text at once. */
  update(opts: TextOptions): void;
  /** Stop every animation and leave the text drawn still. */
  destroy(): void;
}

/** Timings, ms — the numbers the demo settled on, 24.09.2026. */
export const TEXT_TIMING = {
  /** A glyph that goes away erases this fast. */
  erase: 220,
  /** Widths collapse and grow over this long; the tail slides with them. */
  slide: 320,
  /** New glyphs start writing this long after the old ones start erasing. */
  lag: 200,
  /** A stroke writes itself in max(strokeMin, its length × perUnit). */
  strokeMin: 160,
  perUnit: 26,
  /** Pause between two strokes of one glyph. */
  strokeGap: 80,
  /** A dot fades in over this long. */
  dot: 160,
} as const;

const EASE_DRAW = "cubic-bezier(.3,.05,.25,1)";
const EASE_OUT = "cubic-bezier(.5,0,.8,.4)";
const EASE_SLIDE = "cubic-bezier(.3,.7,.2,1)";

/** Reveal dash, as in animate.ts: longer than any path and a gap longer still, so a waiting stroke shows nothing. */
const HIDDEN = 105;
const REVEAL_DASH = "105 300";
/** How much wider the mask stroke is than the stroke it uncovers, in glyph units. */
const REVEAL_EXTRA = 0.9;

// A per-instance prefix, as in animate.ts: two copies of the package on a page
// would otherwise hand out the same mask ids.
const MODULE_ID = Math.random().toString(36).slice(2, 7);
let maskCounter = 0;

/** A glyph svg or a space span, with the character it stands for. */
interface Item {
  char: string;
  el: Element;
}

/** One transition: its animations, and what has to happen when it ends or is cut short. */
interface Flight {
  animations: Animation[];
  finish(): void;
}

/** Whether transitions can play: motion is welcome and the Web Animations API is there. */
function canAnimate(): boolean {
  return !prefersReducedMotion()
    && typeof Element !== "undefined"
    && typeof Element.prototype.animate === "function";
}

/** Parses one element of markup — the controller builds exactly what textMarkup writes. */
function fromMarkup(html: string): Element {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content.firstElementChild!;
}

/** The items of the host in order, read back from its markup: each word's glyphs, then its trailing space. */
function readItems(host: Element): Item[] {
  const items: Item[] = [];
  for (const word of Array.from(host.children)) {
    if (!word.classList.contains(WORD_CLASS)) continue;
    for (const el of Array.from(word.children)) {
      items.push({ char: el.classList.contains(SPACE_CLASS) ? " " : el.getAttribute("data-char") ?? "", el });
    }
  }
  return items;
}

/** Plays a CSS property from one value to another; resolves when it lands, never if cancelled. */
function run(flight: Flight, el: Element, frames: Keyframe[], duration: number, delay: number, easing: string): Promise<void> {
  return new Promise((resolve) => {
    const animation = el.animate(frames, { duration, delay, easing, fill: "forwards" });
    flight.animations.push(animation);
    animation.addEventListener("finish", () => resolve(), { once: true });
  });
}

/** One step of a glyph's reveal: a stroke to run along, or a dot to fade. */
interface Step {
  el: SVGElement;
  dot: boolean;
}

/**
 * Hangs a reveal mask on a glyph: white copies of its strokes, dashed so that
 * moving the offset uncovers or hides a stroke along its length, and white
 * copies of its dots. The steps come in the order of the parts — the order a
 * hand writes the letter. An accent span repeats the contour of its part, so
 * one copy uncovers both.
 */
function reveal(svg: SVGSVGElement, shown: boolean): { steps: Step[]; drop(): void } {
  const body = svg.querySelector<SVGGElement>(`g.${BODY_CLASS}`)!;
  const id = `tc-txt-${MODULE_ID}-${(maskCounter++).toString(36)}`;
  const mask = document.createElementNS(SVGNS, "mask");
  for (const [key, value] of Object.entries({ id, maskUnits: "userSpaceOnUse", x: -3, y: -3, width: 30, height: 30 })) {
    mask.setAttribute(key, String(value));
  }
  const steps: Step[] = [];
  const seen = new Set<string>();
  for (const part of Array.from(body.children) as SVGElement[]) {
    if (part.tagName === "circle") {
      const copy = document.createElementNS(SVGNS, "circle");
      for (const key of ["cx", "cy", "r"]) copy.setAttribute(key, part.getAttribute(key) ?? "0");
      copy.setAttribute("fill", "#fff");
      copy.style.opacity = shown ? "1" : "0";
      mask.appendChild(copy);
      steps.push({ el: copy, dot: true });
      continue;
    }
    const d = part.getAttribute("d") ?? "";
    if (seen.has(d)) continue;
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
    copy.style.strokeDashoffset = String(shown ? 0 : HIDDEN);
    mask.appendChild(copy);
    steps.push({ el: copy, dot: false });
  }
  svg.insertBefore(mask, svg.firstChild);
  body.setAttribute("mask", `url(#${id})`);
  return {
    steps,
    drop: () => {
      mask.remove();
      body.removeAttribute("mask");
    },
  };
}

/** Writes a glyph in, stroke after stroke; resolves when the last one lands. */
async function writeIn(flight: Flight, svg: SVGSVGElement, delay: number): Promise<void> {
  const { steps, drop } = reveal(svg, false);
  const done: Promise<void>[] = [];
  let at = delay;
  for (const step of steps) {
    if (step.dot) {
      done.push(run(flight, step.el, [{ opacity: 0 }, { opacity: 1 }], TEXT_TIMING.dot, at, "ease"));
      at += TEXT_TIMING.dot;
      continue;
    }
    const length = typeof (step.el as SVGPathElement).getTotalLength === "function" ? (step.el as SVGPathElement).getTotalLength() : 0;
    const duration = Math.max(TEXT_TIMING.strokeMin, length * TEXT_TIMING.perUnit);
    done.push(run(flight, step.el, [{ strokeDashoffset: HIDDEN }, { strokeDashoffset: 0 }], duration, at, EASE_DRAW));
    at += duration + TEXT_TIMING.strokeGap;
  }
  await Promise.all(done);
  drop();
}

/** Erases a glyph back along its strokes, all of them at once. */
function eraseOut(flight: Flight, svg: SVGSVGElement): Promise<unknown> {
  const { steps } = reveal(svg, true);
  return Promise.all(steps.map((step) => step.dot
    ? run(flight, step.el, [{ opacity: 1 }, { opacity: 0 }], TEXT_TIMING.dot, 0, "ease")
    : run(flight, step.el, [{ strokeDashoffset: 0 }, { strokeDashoffset: HIDDEN }], TEXT_TIMING.erase, 0, EASE_OUT)));
}

/** Width of an item as laid out: the svg attribute, or the spacer's inline width. */
function widthOf(el: Element): number {
  return el instanceof SVGElement ? Number(el.getAttribute("width") ?? 0) : parseFloat((el as HTMLElement).style.width) || 0;
}

/** Points a kept glyph at its new neighbourhood: the kerning with its new neighbour changes its window. */
function retune(el: Element, glyph: TextGlyph): void {
  for (const key of ["viewBox", "width"] as const) el.setAttribute(key, String(glyph.svgAttrs[key]));
}

const REDRAWN_BY = ["size", "variant", "solid", "accentColor", "strokeWidth", "absoluteStroke"] as const;

/**
 * Takes over `host` and shows `value` in it.
 *
 * Whatever the host held is replaced by the still text — the same DOM
 * textMarkup produces, so taking over server-rendered markup does not flash.
 * The host's own attributes are left to the caller: the wrappers make it an
 * image for readers, labelled with the text as given. Without the Web
 * Animations API, or when the user asks for reduced motion, a new text is
 * drawn at once.
 */
export function createText(host: Element, value: string | number, opts: TextOptions = {}): TextController {
  let options: TextOptions = { ...opts };
  let text = normaliseText(value);
  let items: Item[] = [];
  const flights = new Set<Flight>();

  /** Cuts every transition short: gone glyphs go, masks drop, widths return to the layout. */
  const settle = () => {
    for (const flight of flights) {
      for (const animation of flight.animations) animation.cancel();
      flight.finish();
    }
    flights.clear();
  };

  const rebuild = () => {
    settle();
    host.innerHTML = textMarkup(text, options);
    items = readItems(host);
  };

  const change = (next: string) => {
    const layout = textLayout(next, options);
    const glyphs = layout.words.flat();
    const chars = layout.words.map((word) => word.map((g) => g.char)).flatMap((word, i) => (i ? [" ", ...word] : word));
    const old = items.map((item) => item.char);
    const kind = options.transition ?? "erase";

    // The common head and tail stay; a rewrite keeps nothing.
    let head = 0;
    let tail = 0;
    if (kind !== "rewrite") {
      while (head < old.length && head < chars.length && old[head] === chars[head]) head++;
      while (tail < old.length - head && tail < chars.length - head && old[old.length - 1 - tail] === chars[chars.length - 1 - tail]) tail++;
    }
    const keptAt = (k: number) => (k < head ? items[k] : k >= chars.length - tail ? items[old.length - (chars.length - k)] : undefined);
    const gone = items.slice(head, old.length - tail);

    const nodes: Element[] = [];
    const nextItems: Item[] = [];
    const fresh: Item[] = [];
    let word: Element | null = null;
    let g = 0;
    chars.forEach((char, k) => {
      const kept = keptAt(k);
      if (char === " ") {
        // A space closes its word, so the line can break only after it.
        const el = kept?.el ?? fromMarkup(spaceMarkup(layout.space));
        if (kept) el.setAttribute("style", spaceStyle(layout.space));
        else fresh.push({ char, el });
        word!.appendChild(el);
        word = null;
        nextItems.push({ char, el });
        return;
      }
      const glyph = glyphs[g++]!;
      if (!word) {
        word = document.createElement("span");
        word.className = WORD_CLASS;
        word.setAttribute("style", WORD_STYLE);
        nodes.push(word);
      }
      let el = kept?.el;
      if (el) retune(el, glyph);
      else {
        el = fromMarkup(glyphMarkup(glyph));
        fresh.push({ char, el });
      }
      word.appendChild(el);
      nextItems.push({ char, el });
    });
    host.replaceChildren(...nodes);
    items = nextItems;

    const flight: Flight = { animations: [], finish: () => {} };
    const cleanups: Array<() => void> = [];
    flight.finish = () => {
      for (const cleanup of cleanups.splice(0)) cleanup();
      flights.delete(flight);
    };
    flights.add(flight);
    const slides = kind !== "append";

    const landing: Promise<unknown>[] = [];

    // What went away erases where it stood, at the edit, while its width collapses.
    if (slides && gone.length) {
      const anchor = nextItems[head]?.el ?? null;
      const parent = anchor?.parentNode ?? host.lastElementChild ?? host;
      for (const item of gone) {
        parent.insertBefore(item.el, anchor);
        const width = widthOf(item.el);
        if (item.el instanceof SVGSVGElement) landing.push(eraseOut(flight, item.el));
        landing.push(run(flight, item.el, [{ width: `${width}px` }, { width: "0px" }], TEXT_TIMING.slide, 0, EASE_SLIDE));
        cleanups.push(() => item.el.remove());
      }
    }

    // What arrived grows its width and writes itself in.
    const lag = slides && gone.length ? TEXT_TIMING.lag : 0;
    for (const item of fresh) {
      if (slides) {
        const width = widthOf(item.el);
        landing.push(run(flight, item.el, [{ width: "0px" }, { width: `${width}px` }], TEXT_TIMING.slide, 0, EASE_SLIDE));
      }
      if (item.el instanceof SVGSVGElement) {
        const svg = item.el;
        landing.push(writeIn(flight, svg, lag));
        cleanups.push(() => {
          svg.querySelector("mask")?.remove();
          svg.querySelector(`g.${BODY_CLASS}`)?.removeAttribute("mask");
        });
      }
    }

    // Everything landed: the gone ones leave, the widths return to the layout.
    void Promise.all(landing).then(() => {
      if (!flights.has(flight)) return;
      for (const animation of flight.animations) animation.cancel();
      flight.finish();
    });
  };

  rebuild();

  return {
    get value() {
      return text;
    },

    set(raw) {
      const next = normaliseText(raw);
      if (next === text) return;
      text = next;
      if (!canAnimate()) {
        rebuild();
        return;
      }
      settle();
      change(next);
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
