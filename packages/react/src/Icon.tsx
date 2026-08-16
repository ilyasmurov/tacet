// React wrapper over tacet-core. Knows no geometry: it calls renderSpec and
// animate. What stays inside is only what is genuinely about React — refs, ids,
// size measurement, effects.

import {
  useEffect, useId, useLayoutEffect, useRef, useState, forwardRef,
  type SVGProps, type MutableRefObject,
} from "react";
import {
  renderSpec, animate, prepare, reverse, resetAnimation, resolveAnimateCfg,
  canAnimateOnMount, toReactAttrs, BODY_CLASS, SVG_STYLE,
  type IconVariant, type AnimMode, type ElementSpec,
} from "tacet-core";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  /** Glyph name, for example "rocket" or "guitar-electric". */
  name: string;
  /** Size in pixels. Defaults to 24. */
  size?: number | undefined;
  /** A — one cut · B — all · C — one and accent · D — all and accent. Defaults to D. */
  variant?: IconVariant | undefined;
  /** Solid contour: cuts are not drawn. */
  solid?: boolean | undefined;
  /** Stroke width on screen, in pixels. Once set, size does not affect it. */
  strokeWidth?: number | undefined;
  /** Stroke stops following size. */
  absoluteStroke?: boolean | undefined;
  /** Optical zoom. Turn it off when the actual size is unknown. */
  zoom?: boolean | undefined;
  /** Colour of accent details. Defaults to the --tacet-accent variable. */
  accentColor?: string | undefined;
  /** Play the entrance on mount. */
  animateIn?: boolean | undefined;
  /** Replay on hovering the nearest clickable ancestor. */
  animateOnHover?: boolean | undefined;
  /** Changing the value replays the animation. */
  replayKey?: number | string | undefined;
  /** Delay before the animation starts, ms. */
  animationDelay?: number | undefined;
  /** Override the glyph's animation preset. */
  animationMode?: AnimMode | undefined;
  duration?: number | undefined;
  spinDeg?: number | undefined;
  stagger?: number | undefined;
  seq?: number | undefined;
  /** Label for screen readers. Without it the icon is hidden as decorative. */
  title?: string | undefined;
}

// Where hover is listened for. Clickable ancestors are covered by default —
// hovering a button should animate the icon inside it. Anything else opts in
// with data-tacet-hover: a gallery cell or a card is a comfortable target,
// while a 24px glyph is not.
const HOST_SELECTOR =
  'button, a, [role="button"], [role="menuitem"], [role="tab"], [role="option"], label,'
  + ' [data-tacet-hover]';

// The core emits canonical SVG names (stroke-width). React renders markup with
// them correctly but complains about each one in dev mode — so we translate into
// its spelling. The resulting DOM is the same either way.
function asSvgProps<T>(attrs: Record<string, string | number>): SVGProps<T> {
  return toReactAttrs(attrs) as unknown as SVGProps<T>;
}

function renderElements(parts: ElementSpec[]) {
  return parts.map((part, i) => {
    const key = "p" + i;
    if (part.tag === "circle") return <circle key={key} {...asSvgProps<SVGCircleElement>(part.attrs)} />;
    if (part.tag === "rect") return <rect key={key} {...asSvgProps<SVGRectElement>(part.attrs)} />;
    return <path key={key} {...asSvgProps<SVGPathElement>(part.attrs)} />;
  });
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  {
    name, size = 24, variant, solid, strokeWidth, absoluteStroke, zoom = true, accentColor,
    animateIn = false, animateOnHover = false, replayKey, animationDelay,
    animationMode, duration, spinDeg, stagger, seq, title, style, ...rest
  },
  forwardedRef,
) {
  const innerRef = useRef<SVGSVGElement | null>(null);
  const setRef = (el: SVGSVGElement | null) => {
    innerRef.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef) (forwardedRef as MutableRefObject<SVGSVGElement | null>).current = el;
  };

  // Icons often get shrunk by a CSS class while the attributes stay at the
  // default 24 — and then the stroke, computed for 24, becomes a thread after
  // the shrink. We measure the actual width and compute from it. clientWidth
  // ignores transforms, so the spin and pop animations do not disturb it.
  const [measured, setMeasured] = useState<number | null>(null);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useLayoutEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const width = el.clientWidth || el.getBoundingClientRect().width;
      if (!width) return;
      setMeasured((prev) => {
        const base = prev ?? sizeRef.current;
        return Math.abs(base - width) < 0.5 ? prev : Math.round(width);
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const uid = useId().replace(/:/g, "");
  const effSize = measured ?? size;
  const spec = renderSpec(name, {
    size: effSize, variant, solid, strokeWidth, absoluteStroke, zoom, accentColor,
    idSuffix: uid,
  });

  const cfg = resolveAnimateCfg(name, {
    mode: animationMode, duration, spinDeg, stagger, seq, delay: animationDelay,
  });

  // Hide before the first paint, or the frame flashes the finished picture. If
  // the play never happens — unmounted, frame cancelled — the state has to come
  // off, otherwise the icon stays invisible without a single error.
  useLayoutEffect(() => {
    const svg = innerRef.current;
    if (!animateIn || !svg) return;
    prepare(svg, cfg);
    return () => resetAnimation(svg);
    // Rebuilding the effect on every cfg change is unnecessary: only the moment
    // of appearance and a glyph change matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, animateIn]);

  useEffect(() => {
    if (!animateIn || !innerRef.current) return;
    const svg = innerRef.current;
    const raf = requestAnimationFrame(() => animate(svg, cfg));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, animateIn, replayKey]);

  // Hover replay attaches to the nearest clickable ancestor: you hover the whole
  // button and the icon animates. Standing on its own, the icon listens to
  // itself — animateOnHover is an explicit request, and quietly ignoring it
  // because there is no button around would be the wrong kind of clever.
  useEffect(() => {
    if (!animateOnHover) return;
    const svg = innerRef.current;
    if (!svg) return;
    const host = svg.closest(HOST_SELECTOR) ?? svg;
    const onEnter = () => animate(svg, cfg);
    host.addEventListener("mouseenter", onEnter);
    return () => host.removeEventListener("mouseenter", onEnter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, animateOnHover]);

  if (!spec) {
    if (typeof console !== "undefined") console.warn(`tacet: unknown icon "${name}"`);
    return null;
  }

  return (
    <svg
      ref={setRef}
      {...asSvgProps<SVGSVGElement>(spec.svgAttrs)}
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ ...SVG_STYLE, ...style }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {spec.mask ? (
        <mask {...asSvgProps<SVGMaskElement>(spec.mask.attrs)}>{renderElements(spec.mask.children)}</mask>
      ) : null}
      <g className={BODY_CLASS}>{renderElements(spec.parts)}</g>
    </svg>
  );
});

export { canAnimateOnMount, reverse };
export type { IconVariant, AnimMode };
