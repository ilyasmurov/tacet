// <tacet-icon> — the same engine for projects without React.
//
// Rendering goes into light DOM rather than shadow: this way the markup matches
// what the React wrapper produces (covered by the parity test), and the icon can
// be styled from outside with ordinary CSS.

import {
  renderSpec, animate, prepare, resetAnimation, resolveAnimateCfg, BODY_CLASS, SVG_STYLE,
  type ElementSpec, type IconVariant, type AnimMode, type RenderOpts,
} from "tacet-core";

const SVGNS = "http://www.w3.org/2000/svg";
// Where hover is listened for. Clickable ancestors are covered by default —
// hovering a button should animate the icon inside it. Anything else opts in
// with data-tacet-hover: a gallery cell or a card is a comfortable target,
// while a 24px glyph is not.
const HOST_SELECTOR =
  'button, a, [role="button"], [role="menuitem"], [role="tab"], [role="option"], label,'
  + ' [data-tacet-hover]';

let uid = 0;

function build(spec: ElementSpec): SVGElement {
  const el = document.createElementNS(SVGNS, spec.tag);
  for (const key of Object.keys(spec.attrs)) {
    el.setAttribute(key, String(spec.attrs[key]));
  }
  return el;
}

export class TacetIconElement extends HTMLElement {
  static observedAttributes = [
    "name", "size", "variant", "solid", "stroke-width", "absolute-stroke",
    "zoom", "accent-color", "animate", "animate-on-hover", "replay-key", "label",
  ];

  #uid = "e" + (uid++).toString(36);
  #host: Element | null = null;
  #onEnter = () => {
    const svg = this.querySelector("svg");
    if (svg) animate(svg as SVGSVGElement, this.#cfg());
  };

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    this.#unbindHover();
    // The element may have been removed before the animation played: drop the
    // mask and the timer, or it comes back to the DOM hidden.
    const svg = this.querySelector("svg");
    if (svg) resetAnimation(svg as SVGSVGElement);
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.render();
  }

  #num(attr: string): number | undefined {
    const raw = this.getAttribute(attr);
    if (raw == null || raw === "") return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  }

  #bool(attr: string): boolean {
    const raw = this.getAttribute(attr);
    return raw != null && raw !== "false";
  }

  #opts(): RenderOpts {
    const opts: RenderOpts = { idSuffix: this.#uid };
    const size = this.#num("size");
    if (size != null) opts.size = size;
    const variant = this.getAttribute("variant");
    if (variant) opts.variant = variant as IconVariant;
    if (this.hasAttribute("solid")) opts.solid = this.#bool("solid");
    const sw = this.#num("stroke-width");
    if (sw != null) opts.strokeWidth = sw;
    if (this.hasAttribute("absolute-stroke")) opts.absoluteStroke = this.#bool("absolute-stroke");
    if (this.hasAttribute("zoom")) opts.zoom = this.#bool("zoom");
    const accent = this.getAttribute("accent-color");
    if (accent) opts.accentColor = accent;
    return opts;
  }

  #cfg() {
    const name = this.getAttribute("name") ?? "";
    return resolveAnimateCfg(name, {
      mode: (this.getAttribute("animation-mode") as AnimMode | null) ?? undefined,
      duration: this.#num("duration"),
      spinDeg: this.#num("spin-deg"),
      stagger: this.#num("stagger"),
      seq: this.#num("seq"),
      delay: this.#num("animation-delay"),
    });
  }

  #unbindHover(): void {
    if (!this.#host) return;
    this.#host.removeEventListener("mouseenter", this.#onEnter);
    this.#host = null;
  }

  #bindHover(): void {
    this.#unbindHover();
    if (!this.#bool("animate-on-hover")) return;
    // The nearest clickable ancestor if there is one — hovering a button should
    // animate the icon inside it. With no such ancestor the element listens to
    // itself: the attribute is an explicit request, and refusing it because the
    // icon happens to stand on its own would be a silent no-op.
    const host = this.closest(HOST_SELECTOR) ?? this;
    this.#host = host;
    host.addEventListener("mouseenter", this.#onEnter);
  }

  /** Re-render. Called automatically when attributes change. */
  render(): void {
    const name = this.getAttribute("name") ?? "";
    const spec = renderSpec(name, this.#opts());
    this.textContent = "";
    this.#unbindHover();

    if (!spec) {
      if (name && typeof console !== "undefined") {
        console.warn(`tacet: unknown icon "${name}"`);
      }
      return;
    }

    const size = this.#num("size") ?? 24;
    const label = this.getAttribute("label");

    const svg = document.createElementNS(SVGNS, "svg");
    for (const key of Object.keys(spec.svgAttrs)) {
      svg.setAttribute(key, String(spec.svgAttrs[key]));
    }
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    if (label) {
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", label);
      const titleEl = document.createElementNS(SVGNS, "title");
      titleEl.textContent = label;
      svg.appendChild(titleEl);
    } else {
      svg.setAttribute("aria-hidden", "true");
    }
    svg.style.overflow = SVG_STYLE.overflow;

    if (spec.mask) {
      const mask = document.createElementNS(SVGNS, "mask");
      for (const key of Object.keys(spec.mask.attrs)) {
        mask.setAttribute(key, String(spec.mask.attrs[key]));
      }
      for (const child of spec.mask.children) mask.appendChild(build(child));
      svg.appendChild(mask);
    }

    const body = document.createElementNS(SVGNS, "g");
    body.setAttribute("class", BODY_CLASS);
    for (const part of spec.parts) body.appendChild(build(part));
    svg.appendChild(body);

    this.appendChild(svg);
    this.#bindHover();

    if (this.#bool("animate")) {
      const cfg = this.#cfg();
      prepare(svg, cfg);
      requestAnimationFrame(() => animate(svg, cfg));
    }
  }
}

/** Register <tacet-icon>. Calling again is harmless; in Node it stays quiet. */
export function defineTacetIcon(tag = "tacet-icon"): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(tag)) return;
  customElements.define(tag, TacetIconElement);
}
