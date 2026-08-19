// React Native wrapper over tacet-core. Knows no geometry: it asks the engine
// for a spec and draws it with react-native-svg. What stays here is only what is
// genuinely about the phone — attribute spelling, contour length instead of
// pathLength, and the entrance drawn with Animated.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
// Named import, not default: the package ships as CommonJS, and under NodeNext
// resolution a default import resolves to the namespace object rather than the
// component.
import { Svg, Circle, G, Mask, Path, Rect } from "react-native-svg";
import { normalizeSize, renderSpec, SVG_STYLE, type ElementSpec, type IconVariant } from "tacet-core";
import { dashInUnits, partLength } from "./pathLength.js";
import { toNativeAttrs, type NativeColors } from "./nativeAttrs.js";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** How long the contour draws itself. The same as on the web. */
const DRAW_MS = 620;
/**
 * How much wider the reveal stroke is than the contour it uncovers. Equal
 * widths leave the edges of round caps behind the mask, and the glyph appears
 * with a shaved outline.
 */
const REVEAL_EXTRA = 0.75;
/** Rings this small reveal whole: stroking them along the path looks like a jitter. */
const SMALL_RING = 3;

export interface IconProps {
  /** Glyph name, for example "rocket" or "guitar-electric". */
  name: string;
  /** Size in pixels. Defaults to 24. */
  size?: number | undefined;
  /** Colour of the glyph. There is no cascade on a phone, so it is explicit. */
  color?: string | undefined;
  /** Colour of accent details. Defaults to the glyph colour — a monochrome icon. */
  accentColor?: string | undefined;
  /** A — one cut · B — all · C — one and accent · D — all and accent. Defaults to D. */
  variant?: IconVariant | undefined;
  /** Solid contour: cuts are not drawn. */
  solid?: boolean | undefined;
  /** Stroke width on screen, in pixels. Once set, size does not affect it. */
  strokeWidth?: number | undefined;
  /** Optical zoom. Turn it off when the actual size is unknown. */
  zoom?: boolean | undefined;
  /**
   * Changing the value draws the glyph again.
   *
   * The entrance is not played on mount on purpose: a list holds dozens of icons
   * and they would all draw themselves at once, on the very scroll where the
   * animation cannot be seen. By request — on a button press — it costs one icon
   * and half a second.
   *
   * Only the `draw` mode is implemented here; `spin`, `pop` and the per-glyph
   * presets from `ANIM` are web-only for now.
   */
  replayKey?: number | string | undefined;
  /** Label for screen readers. Without it the icon is hidden as decorative. */
  title?: string | undefined;
}

export function Icon({
  name,
  size = 24,
  color = "#000",
  accentColor,
  variant,
  solid,
  strokeWidth,
  zoom,
  replayKey,
  title,
}: IconProps) {
  // 1 — the glyph is fully uncovered. The animation runs from 0 to 1, and only
  // while it plays does the reveal mask exist: at rest the icon is plain SVG.
  const progress = useRef(new Animated.Value(1)).current;
  const [drawing, setDrawing] = useState(false);
  const played = useRef(replayKey);

  // Layout effect, not a plain one: the mask has to cover the glyph before the
  // frame is painted, or the first frame flashes the finished picture.
  useLayoutEffect(() => {
    if (replayKey === undefined || replayKey === played.current) return;
    played.current = replayKey;
    setDrawing(true);
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: DRAW_MS,
      // The same curve as on the web: quick start, soft stop.
      easing: Easing.bezier(0.45, 0, 0.2, 1),
      // The native driver only knows transforms and opacity, and here the dash
      // length changes. One icon for half a second is a small price.
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setDrawing(false);
    });
  }, [replayKey, progress]);

  // The animation outlives the component otherwise: with useNativeDriver: false
  // it is a JS-thread loop, and in a list icons come and go by the dozen.
  useEffect(() => () => progress.stopAnimation(), [progress]);

  const spec = renderSpec(name, {
    size,
    ...(variant !== undefined ? { variant } : {}),
    ...(solid !== undefined ? { solid } : {}),
    ...(strokeWidth !== undefined ? { strokeWidth } : {}),
    ...(zoom !== undefined ? { zoom } : {}),
  });
  if (!spec) return null;

  const colors: NativeColors = { color, accentColor: accentColor ?? color };
  const revealId = `tc-rev-${spec.mask ? spec.mask.id : name}`;
  // The engine measured the spec against a normalised size — the view has to
  // match, or a nonsensical prop leaves a sane glyph in a NaN-sized box.
  const px = normalizeSize(size);

  return (
    <Svg
      width={px}
      height={px}
      viewBox={String(spec.svgAttrs["viewBox"])}
      fill="none"
      // Optical zoom trims the viewBox, and the sharpest glyphs reach past it —
      // a map pin by a pixel and a half. iOS honours the style; Android clips by
      // the view either way, so there `zoom={false}` is the way out.
      style={SVG_STYLE}
      {...(title
        ? { accessibilityLabel: title, accessible: true, accessibilityRole: "image" as const }
        : // Both flags: the first is iOS only, the second Android only, and a
          // decorative icon must stay out of the reader on either.
          { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const })}
    >
      {/* Cut-outs. The engine hangs this mask on the parts that ask for it, one
          by one — masking the whole group instead would burn away what happens
          to lie inside a cut-out: a calendar would lose the clock in its corner. */}
      {spec.mask ? (
        <Mask id={spec.mask.id} {...(toNativeAttrs(spec.mask.attrs, colors, null, dashInUnits) as object)}>
          {renderParts(spec.mask.children, colors)}
        </Mask>
      ) : null}

      {/* The glyph is uncovered by a mask, not by its own dash — otherwise the
          animation would fight the cuts over the same attribute and the gaps
          would crawl along the path instead of holding their place. Same reason
          as on the web, same construction: white copies of the parts, drawn a
          little thicker. Fills have no length to draw along, so they are
          uncovered whole together with the strokes. */}
      {drawing ? (
        <Mask id={revealId} maskUnits="userSpaceOnUse" x={-3} y={-3} width={30} height={30}>
          {renderReveal(spec.parts, progress)}
        </Mask>
      ) : null}

      <G {...(drawing ? { mask: `url(#${revealId})` } : {})}>{renderParts(spec.parts, colors)}</G>
    </Svg>
  );
}

function renderParts(parts: ElementSpec[], colors: NativeColors) {
  return parts.map((part, i) => {
    const attrs = toNativeAttrs(part.attrs, colors, lengthOf(part), dashInUnits);
    const key = "p" + i;
    if (part.tag === "circle") return <Circle key={key} {...(attrs as object)} />;
    if (part.tag === "rect") return <Rect key={key} {...(attrs as object)} />;
    return <Path key={key} {...(attrs as object)} />;
  });
}

/** White copies of the glyph, uncovering it as the offset runs down to zero. */
function renderReveal(parts: ElementSpec[], progress: Animated.Value) {
  return parts.map((part, i) => {
    const key = "r" + i;
    const attrs = part.attrs;
    const stroked = attrs["stroke"] != null && attrs["stroke"] !== "none";
    const length = stroked ? lengthOf(part) : null;
    const ring = part.tag === "circle" && Number(attrs["r"] ?? 0) <= SMALL_RING;
    const width = Number(attrs["stroke-width"] ?? 2) + REVEAL_EXTRA;

    // A fill or a tiny ring has nothing to draw along: it is uncovered whole,
    // which on the web is the `pop` those parts get.
    if (!length || ring) {
      const solid = {
        ...shapeOf(part),
        ...(stroked
          ? { stroke: "#fff", fill: "none", strokeWidth: width, strokeLinecap: "round" as const }
          : { fill: "#fff", stroke: "none" }),
      };
      return element(part, key, solid, false);
    }

    const drawn = {
      ...shapeOf(part),
      stroke: "#fff",
      fill: "none",
      strokeWidth: width,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
      strokeDasharray: [length, length],
      strokeDashoffset: progress.interpolate({ inputRange: [0, 1], outputRange: [length, 0] }),
      // The transform has to be repeated, or the copy uncovers empty space next
      // to the part it belongs to.
      ...(attrs["transform"] != null ? { transform: attrs["transform"] } : {}),
    };
    return element(part, key, drawn, true);
  });
}

/** Geometry of a part: everything that says where it is, and nothing about paint. */
function shapeOf(part: ElementSpec): Record<string, string | number> {
  const a = part.attrs;
  if (part.tag === "circle") return { cx: Number(a["cx"]), cy: Number(a["cy"]), r: Number(a["r"]) };
  if (part.tag === "rect") {
    return {
      x: Number(a["x"]),
      y: Number(a["y"]),
      width: Number(a["width"]),
      height: Number(a["height"]),
      rx: Number(a["rx"] ?? 0),
    };
  }
  return { d: String(a["d"]) };
}

function element(part: ElementSpec, key: string, props: object, animated: boolean) {
  if (part.tag === "circle") {
    return animated ? <AnimatedCircle key={key} {...props} /> : <Circle key={key} {...props} />;
  }
  if (part.tag === "rect") {
    return animated ? <AnimatedRect key={key} {...props} /> : <Rect key={key} {...props} />;
  }
  return animated ? <AnimatedPath key={key} {...props} /> : <Path key={key} {...props} />;
}

/** Contour length of a drawn element, built back out of its attributes. */
function lengthOf(part: ElementSpec): number | null {
  const a = part.attrs;
  if (part.tag === "circle") return partLength({ t: "circle", r: Number(a["r"]) });
  if (part.tag === "rect") {
    return partLength({
      t: "rect",
      w: Number(a["width"]),
      h: Number(a["height"]),
      rx: Number(a["rx"] ?? 0),
    });
  }
  return partLength({ t: "path", d: String(a["d"] ?? "") });
}
