// Animation on top of an already rendered svg. Works with a plain DOM element,
// so it serves the React wrapper and the custom element equally well.

import { ANIM, type AnimMode } from "./data.js";
import { BODY_CLASS } from "./renderSpec.js";

const SVGNS = "http://www.w3.org/2000/svg";
const BODY_SELECTOR = `g.${BODY_CLASS}`;

const FILL_SELECTOR =
  "circle[fill]:not([fill='none']):not([data-mk]):not([data-rev])," +
  "rect[fill]:not([fill='none']):not([data-mk]):not([data-rev])," +
  "path[fill]:not([fill='none']):not([data-mk]):not([data-rev])";
const SCALE_SELECTOR = FILL_SELECTOR + `, g.${BODY_CLASS} [data-pop]`;

// The counter is module-scoped, so two copies of the package on one page would
// hand out identical ids — and url(#id) resolves across the whole document,
// taking the first node it finds, which would mask the second icon with the
// silhouette of the first. A per-instance prefix keeps them apart for good.
const MODULE_ID = Math.random().toString(36).slice(2, 7);
let maskCounter = 0;

export interface AnimateCfg {
  mode?: AnimMode | undefined;
  /** Draw-in duration, ms. */
  duration?: number | undefined;
  /** Rotation for the spin mode, degrees. */
  spinDeg?: number | undefined;
  /** Spread of stroke starts, ms: the contour assembles out of order. */
  stagger?: number | undefined;
  /** Strict queue of strokes, ms per stroke. */
  seq?: number | undefined;
  /** Delay before the start, ms. */
  delay?: number | undefined;
}

/** What resolveAnimateCfg returns and prepare/animate expect. */
export interface ResolvedAnimateCfg {
  mode: AnimMode; duration: number; spinDeg: number; stagger: number; seq: number; delay: number;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Whether the entrance animation should play on this device.
 *
 * On a phone icons appear while the page is being scrolled — the animation is
 * barely seen, yet it costs a lot: on a bench of 360 icons rendering took
 * 1718 ms against 857 ms without it and left an extra thousand nodes in the
 * DOM. The reason is that the draw mode builds a mask out of clones of every
 * shape per icon and forces a reflow.
 *
 * The predicate is passed in (in a browser — `window.matchMedia`) so the rule
 * can be covered by a test instead of guessing about the environment.
 */
export function canAnimateOnMount(matches: ((query: string) => boolean) | null): boolean {
  if (!matches) return false;
  return matches("(hover: hover) and (pointer: fine)");
}

/** The glyph's animation preset, extended with whatever the call passed in. */
export function resolveAnimateCfg(name: string, cfg: AnimateCfg = {}): ResolvedAnimateCfg {
  const preset = ANIM[name] ?? {};
  return {
    mode: cfg.mode ?? preset.mode ?? "draw",
    duration: cfg.duration ?? preset.dur ?? 620,
    spinDeg: cfg.spinDeg ?? preset.deg ?? 90,
    stagger: cfg.stagger ?? preset.stagger ?? 0,
    seq: cfg.seq ?? preset.seq ?? 0,
    delay: cfg.delay ?? 0,
  };
}

/** What describes the current body contents: it shows when the glyph changed. */
function bodySignature(svg: SVGSVGElement, body: SVGGElement): string {
  return (svg.getAttribute("data-icon") ?? "") + ":" + body.children.length;
}

function dropReveal(svg: SVGSVGElement, body: SVGGElement): void {
  const id = body.dataset["revealId"];
  if (!id) return;
  svg.querySelector(`mask#${id}`)?.remove();
  delete body.dataset["revealId"];
  delete body.dataset["revealFor"];
  body.removeAttribute("mask");
}

/**
 * The reveal mask: clones of every shape of the glyph, stroked slightly thicker
 * than the original. What gets animated is the mask's `stroke-dashoffset`, not
 * the contour itself — otherwise the animation would fight the cuts over the
 * same attribute and the gaps would crawl along the path instead of holding
 * their place.
 *
 * The mask is cached on the body but rebuilt as soon as the contents change:
 * React reuses the same svg node when the icon name changes, and a stale mask
 * would reveal the new glyph through somebody else's silhouette.
 */
function buildReveal(svg: SVGSVGElement, body: SVGGElement): NodeListOf<SVGElement> {
  const signature = bodySignature(svg, body);
  const cachedId = body.dataset["revealId"];
  if (cachedId && body.dataset["revealFor"] === signature) {
    return svg.querySelectorAll<SVGElement>(`#${cachedId} [data-rev]`);
  }
  dropReveal(svg, body);

  const id = `tc-rev-${MODULE_ID}-${(maskCounter++).toString(36)}`;
  const mask = document.createElementNS(SVGNS, "mask");
  mask.setAttribute("id", id);
  mask.setAttribute("maskUnits", "userSpaceOnUse");
  mask.setAttribute("x", "-3"); mask.setAttribute("y", "-3");
  mask.setAttribute("width", "30"); mask.setAttribute("height", "30");

  body.querySelectorAll("path, circle, rect").forEach((el) => {
    const clone = el.cloneNode(false) as SVGElement;
    clone.removeAttribute("mask");
    // The clone lives by its own reveal rules — somebody else's memory of cuts
    // only gets in the way and confuses the selectors.
    clone.removeAttribute("data-dash");
    clone.style.cssText = "";

    const strokeAttr = el.getAttribute("stroke");
    const isStroke = !!strokeAttr && strokeAttr !== "none";
    // Stroking tiny rings is pointless — they reveal whole, like fills do.
    const smallRing = isStroke && el.tagName === "circle" && parseFloat(el.getAttribute("r") ?? "0") <= 3;

    if (isStroke && !smallRing) {
      const width = parseFloat(el.getAttribute("stroke-width") ?? "2");
      clone.setAttribute("stroke", "#fff");
      clone.setAttribute("fill", "none");
      clone.setAttribute("stroke-width", String(width + 0.75));
      clone.setAttribute("stroke-linecap", "round");
      clone.setAttribute("stroke-linejoin", "round");
      clone.setAttribute("pathLength", "100");
      clone.setAttribute("stroke-dasharray", "100 100");
      clone.setAttribute("stroke-dashoffset", "100");
      clone.setAttribute("data-rev", "1");
    } else if (smallRing) {
      const width = parseFloat(el.getAttribute("stroke-width") ?? "2");
      clone.setAttribute("stroke", "#fff");
      clone.setAttribute("fill", "none");
      clone.setAttribute("stroke-width", String(width + 0.75));
      clone.removeAttribute("stroke-dasharray");
      clone.setAttribute("data-fillrev", "1");
      el.setAttribute("data-pop", "1");
    } else {
      clone.setAttribute("fill", "#fff");
      clone.setAttribute("stroke", "none");
      clone.removeAttribute("stroke-dasharray");
      clone.setAttribute("data-fillrev", "1");
    }
    mask.appendChild(clone);
  });

  svg.appendChild(mask);
  body.dataset["revealId"] = id;
  body.dataset["revealFor"] = signature;
  return svg.querySelectorAll<SVGElement>(`#${id} [data-rev]`);
}

/**
 * Restore the live shapes. Needed after reverse(): that one dims and collapses
 * the contour itself, while the entrance is drawn with a mask and never touches
 * live shapes — without the restore an icon that "erased and drew again" would
 * stay invisible.
 */
function restoreLive(svg: SVGSVGElement): void {
  // Body shapes only: clones inside the mask also carry data-dash, and handing
  // them back their "original" dasharray would break the reveal — theirs is a
  // different, working one ("100 100" plus an offset).
  svg.querySelectorAll<SVGElement>(`g.${BODY_CLASS} [data-dash]`).forEach((el) => {
    el.style.transition = "none";
    el.style.opacity = "";
    const dash = el.dataset["dash"];
    if (dash) el.style.strokeDasharray = dash;
  });
  svg.querySelectorAll<SVGElement>(FILL_SELECTOR).forEach((el) => {
    el.style.transition = "none";
    el.style.opacity = "";
    el.style.transform = "";
  });
}

/**
 * Drop everything prepare/animate/reverse put on the element and show the icon
 * as it is. Call it when an animation was prepared but never played: otherwise
 * the glyph stays hidden under the mask without a single error in the console.
 */
export function resetAnimation(svg: SVGSVGElement): void {
  const body = svg.querySelector<SVGGElement>(BODY_SELECTOR);
  svg.style.transform = "";
  svg.style.opacity = "";
  svg.style.transition = "";
  restoreLive(svg);
  if (!body) return;
  const timers = body as unknown as { __tcRevealTimer?: number };
  if (timers.__tcRevealTimer) {
    clearTimeout(timers.__tcRevealTimer);
    delete timers.__tcRevealTimer;
  }
  dropReveal(svg, body);
  body.style.transition = "";
  body.style.opacity = "";
  body.style.transform = "";
}

/**
 * Hide the glyph before the animation starts so the first frame does not flash
 * the finished picture. Called synchronously after insertion into the DOM,
 * before paint.
 */
export function prepare(svg: SVGSVGElement, cfg: ResolvedAnimateCfg): void {
  if (prefersReducedMotion()) return;
  const body = svg.querySelector<SVGGElement>(BODY_SELECTOR);
  if (!body) return;

  svg.style.transform = "";
  svg.style.opacity = "";
  restoreLive(svg);

  if (cfg.mode === "pop") {
    body.style.transformBox = "fill-box";
    body.style.transformOrigin = "center";
    body.style.transition = "none";
    body.style.transform = "scale(0.2)";
    body.style.opacity = "0";
    return;
  }
  if (cfg.mode === "fade") {
    body.style.transition = "none";
    body.style.opacity = "0";
    return;
  }

  const revs = buildReveal(svg, body);
  body.setAttribute("mask", `url(#${body.dataset["revealId"]})`);
  revs.forEach((el) => { el.style.transition = "none"; el.style.strokeDashoffset = "100"; });
  svg.querySelectorAll<SVGElement>(SCALE_SELECTOR).forEach((el) => {
    el.style.transformBox = "fill-box";
    el.style.transformOrigin = "center";
    el.style.transition = "none";
    el.style.transform = "scale(0)";
  });
  if (cfg.mode === "spin") {
    svg.style.transformOrigin = "center";
    svg.style.transition = "none";
    svg.style.transform = `rotate(-${cfg.spinDeg}deg)`;
  }
}

/** Play the entrance. Safe to call again — that is exactly what a replay is. */
export function animate(svg: SVGSVGElement, cfg: ResolvedAnimateCfg): void {
  if (prefersReducedMotion()) return;
  const body = svg.querySelector<SVGGElement>(BODY_SELECTOR);
  if (!body) return;
  const { delay, duration, stagger, seq } = cfg;

  // After reverse() the live shapes are dimmed and collapsed — bring them back,
  // otherwise the mask would be drawing over an invisible glyph.
  restoreLive(svg);

  if (cfg.mode === "pop") {
    body.style.transformBox = "fill-box";
    body.style.transformOrigin = "center";
    body.style.transition = "none";
    body.style.transform = "scale(0.2)";
    body.style.opacity = "0";
    void body.getBoundingClientRect();
    body.style.transition = `transform .55s cubic-bezier(.34,1.56,.64,1) ${delay}ms, opacity .25s ease ${delay}ms`;
    body.style.transform = "scale(1)";
    body.style.opacity = "1";
    return;
  }
  if (cfg.mode === "fade") {
    body.style.transition = "none";
    body.style.opacity = "0";
    void body.getBoundingClientRect();
    body.style.transition = `opacity .5s ease ${delay}ms`;
    body.style.opacity = "1";
    return;
  }

  const revs = buildReveal(svg, body);
  body.setAttribute("mask", `url(#${body.dataset["revealId"]})`);
  revs.forEach((el) => { el.style.transition = "none"; el.style.strokeDashoffset = "100"; });
  void body.getBoundingClientRect();

  const order = Array.from({ length: revs.length }, (_, i) => i);
  if (stagger) {
    for (let k = order.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      const tmp = order[k]!; order[k] = order[j]!; order[j] = tmp;
    }
  }

  let maxExtra = 0;
  revs.forEach((el, i) => {
    const extra = seq
      ? i * seq
      : stagger ? (order[i] ?? 0) * stagger * (0.6 + Math.random() * 0.6) : 0;
    if (extra > maxExtra) maxExtra = extra;
    el.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(.45,0,.2,1) ${delay + extra}ms`;
    el.style.strokeDashoffset = "0";
  });

  if (cfg.mode === "spin") {
    svg.style.transformOrigin = "center";
    svg.style.transition = "none";
    svg.style.transform = `rotate(-${cfg.spinDeg}deg)`;
    void svg.getBoundingClientRect();
    svg.style.transition = `transform ${duration}ms cubic-bezier(.3,0,.2,1) ${delay}ms`;
    svg.style.transform = "rotate(0deg)";
  }

  // The mask comes off once it has done its job: while it hangs there, the
  // glyph is clipped by it.
  const timers = body as unknown as { __tcRevealTimer?: number };
  if (timers.__tcRevealTimer) clearTimeout(timers.__tcRevealTimer);
  timers.__tcRevealTimer = window.setTimeout(
    () => body.removeAttribute("mask"),
    delay + duration + maxExtra + 80,
  );

  svg.querySelectorAll<SVGElement>(SCALE_SELECTOR).forEach((el, i) => {
    const isPop = el.hasAttribute("data-pop");
    const at = delay + (isPop ? 320 : 240) + i * 50;
    el.style.transformBox = "fill-box";
    el.style.transformOrigin = "center";
    el.style.transition = "none";
    el.style.transform = "scale(0)";
    void el.getBoundingClientRect();
    el.style.transition = `transform .5s cubic-bezier(.34,1.56,.64,1) ${at}ms`;
    el.style.transform = "scale(1)";
  });
}

/**
 * The way back: the contour erases, fills collapse. For loaders and for icons
 * leaving the screen. The next animate() brings everything back.
 */
export function reverse(svg: SVGSVGElement): void {
  if (prefersReducedMotion()) return;

  svg.querySelectorAll<SVGElement>(`g.${BODY_CLASS} [data-dash]`).forEach((el) => {
    const dash = el.dataset["dash"];
    if (!dash) return;
    const parts = dash.split(" ");
    const gapCount = parts.filter((_, i) => i % 2 === 1).length || 1;
    const collapsed = parts.map((_, i) => (i % 2 === 1 ? 100 / gapCount : 0)).join(" ");
    el.style.transition = "stroke-dasharray .5s cubic-bezier(.45,0,.55,1), opacity .16s ease .34s";
    el.style.strokeDasharray = collapsed;
    el.style.opacity = "0";
  });

  svg.querySelectorAll<SVGElement>(FILL_SELECTOR).forEach((el) => {
    el.style.transformBox = "fill-box";
    el.style.transformOrigin = "center";
    el.style.transition = "transform .3s cubic-bezier(.4,0,1,.6)";
    el.style.transform = "scale(0)";
  });
}
