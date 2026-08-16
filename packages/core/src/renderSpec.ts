// "Glyph name in, ready SVG attributes out." A pure function: no DOM, no React.
// Both wrappers lean on it, which is why the set has exactly one engine.

import { ICONS, SOLID_BY_DEFAULT, type IconDef, type IconName, type Part } from "./data.js";
import { dashFor, insetFor, normalizeSize, strokeOnScreen, type StrokeOpts } from "./stroke.js";

/** A — one cut · B — all cuts · C — one cut and accent · D — all cuts and accent. */
export type IconVariant = "A" | "B" | "C" | "D";

/** Colour of accent details. Without the variable the icon is monochrome. */
export const ACCENT_VAR = "var(--tacet-accent, currentColor)";

/**
 * Class of the group holding the glyph body. The engine finds what to animate
 * by it: without this group `animate()` silently does nothing.
 */
export const BODY_CLASS = "tc-body";

/**
 * Styles the svg cannot be drawn correctly without. `overflow: visible` is
 * required: with optical zoom the edges of glyphs reach past the viewBox window,
 * and browsers clip them by default.
 */
export const SVG_STYLE = { overflow: "visible" } as const;

// ICONS is closed with `satisfies`, otherwise IconName degrades into string.
// Looking up by an arbitrary string needs a wider view of the same object.
const BY_NAME = ICONS as Record<string, IconDef>;

export interface RenderOpts extends StrokeOpts {
  /** Size in pixels, used for both width and height. Defaults to 24. */
  size?: number | undefined;
  /** Defaults to D. */
  variant?: IconVariant | undefined;
  /** Solid contour: cuts are ignored, the `gaps` data itself stays untouched. */
  solid?: boolean | undefined;
  /** Optical zoom. Turn it off when the actual size is unknown. On by default. */
  zoom?: boolean | undefined;
  /** What to paint accent details with. Defaults to the `--tacet-accent` variable. */
  accentColor?: string | undefined;
  /**
   * Suffix for the mask id. Needed when a page holds several instances of the
   * same glyph: different glyphs already get different ids, the name is part of
   * it. Only letters, digits, hyphen and underscore are kept from the string.
   */
  idSuffix?: string | undefined;
}

export interface ElementSpec {
  tag: "path" | "circle" | "rect";
  attrs: Record<string, string | number>;
}

export interface MaskSpec {
  id: string;
  attrs: Record<string, string | number>;
  children: ElementSpec[];
}

export interface RenderResult {
  /** Attributes for the root `<svg>`. Styles are not included — see SVG_STYLE. */
  svgAttrs: Record<string, string | number>;
  /** Cut-out mask, when the glyph has `hole` parts. */
  mask: MaskSpec | null;
  /** The glyph body. Goes inside `<g class="tc-body">`, or animation won't find it. */
  parts: ElementSpec[];
  /**
   * Value for the `stroke-width` attribute, in viewBox units. This is NOT the
   * same as `RenderOpts.strokeWidth`, which is given in screen pixels. To feed
   * a value back into the options use `strokeOnScreen`, not this field.
   */
  strokeAttr: number;
  /** Stroke width on screen, in CSS pixels. */
  strokeOnScreen: number;
}

function isSolid(name: string, solid: boolean | undefined): boolean {
  if (solid != null) return solid;
  return SOLID_BY_DEFAULT.includes(name);
}

function colorFor(part: Part, variant: IconVariant, accent: string): string {
  if (part.col) return part.col;
  const accentOn = (variant === "C" || variant === "D") && part.accent;
  return accentOn ? accent : "currentColor";
}

/** The id lands in an attribute and in url(#...) — allow safe characters only. */
function safeId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_-]/g, "");
}

function shapeAttrs(part: Part): { tag: ElementSpec["tag"]; attrs: Record<string, string | number> } {
  if (part.t === "circle") {
    return { tag: "circle", attrs: { cx: part.cx!, cy: part.cy!, r: part.r! } };
  }
  if (part.t === "rect") {
    return { tag: "rect", attrs: { x: part.x!, y: part.y!, width: part.w!, height: part.h!, rx: part.rx! } };
  }
  return { tag: "path", attrs: { d: part.d! } };
}

function buildHoleMask(def: IconDef, id: string): MaskSpec | null {
  const holes = def.filter((p): p is Part => !!p && p.t === "hole");
  if (!holes.length) return null;

  const children: ElementSpec[] = [
    { tag: "rect", attrs: { x: 0, y: 0, width: 24, height: 24, fill: "#fff", "data-mk": "1" } },
  ];
  for (const hole of holes) {
    if (hole.d) {
      children.push({
        tag: "path",
        attrs: {
          d: hole.d, fill: "none", stroke: "#000", "stroke-width": hole.sw ?? 2.2,
          "stroke-linecap": "round", "stroke-linejoin": "round", "data-mk": "1",
        },
      });
    } else {
      children.push({
        tag: "circle",
        attrs: { cx: hole.cx!, cy: hole.cy!, r: hole.r!, fill: "#000", "data-mk": "1" },
      });
    }
  }
  return {
    id,
    attrs: { id, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 24, height: 24 },
    children,
  };
}

/** Whether the set has such a glyph. */
export function hasIcon(name: string): name is IconName {
  return Object.prototype.hasOwnProperty.call(ICONS, name);
}

/** Every name in the set, in declaration order. */
export function iconNames(): IconName[] {
  return Object.keys(ICONS) as IconName[];
}

export function renderSpec(name: string, opts: RenderOpts = {}): RenderResult | null {
  // hasOwnProperty rather than `ICONS[name]`: otherwise "toString" and "valueOf"
  // pick up prototype methods, pass the existence check and crash the function
  // where the contract says it must return null.
  if (!hasIcon(name)) return null;
  const def = BY_NAME[name]!;

  const size = normalizeSize(opts.size ?? 24);
  const variant = opts.variant ?? "D";
  const accent = opts.accentColor ?? ACCENT_VAR;
  const solid = isSolid(name, opts.solid);
  const zoom = opts.zoom ?? true;

  const inset = zoom ? insetFor(size) : 0;
  const visible = 24 - 2 * inset;
  const onScreen = strokeOnScreen(size, opts);
  // The attribute is set in viewBox units and everything is then multiplied by
  // size/visible on screen. Hence the reverse conversion — this way the actual
  // on-screen width equals onScreen exactly.
  const strokeAttr = (onScreen * visible) / size;

  const suffix = opts.idSuffix ? safeId(opts.idSuffix) : "";
  const maskId = `tc-hole-${safeId(name)}${suffix ? "-" + suffix : ""}`;
  const mask = buildHoleMask(def, maskId);

  const parts: ElementSpec[] = [];
  for (const part of def) {
    if (!part || part.t === "hole") continue;
    const { tag, attrs } = shapeAttrs(part);
    const color = colorFor(part, variant, accent);

    // Under non-scaling-stroke the width is measured in viewport coordinates,
    // so the viewBox scale does not apply and there is nothing to compensate.
    // Feed strokeAttr here and the part ends up thinner than its neighbours,
    // the more so the larger the icon: at 128px a violin body would be six
    // times thinner than its own neck.
    let nonScaling = false;
    if (part.tf) {
      attrs["transform"] = part.tf;
      if (!part.scaleStroke) {
        attrs["vector-effect"] = "non-scaling-stroke";
        nonScaling = true;
      }
    }
    if (part.masked && mask) attrs["mask"] = `url(#${mask.id})`;

    if (part.fill || part.activeFill) {
      attrs["fill"] = color;
    } else {
      let dash = "100 0";
      if (part.dashArray) dash = part.dashArray;
      else if (!solid && part.gaps && part.gaps.length) {
        const used = variant === "B" || variant === "D" ? part.gaps : part.gaps.slice(0, 1);
        dash = dashFor(used);
      }
      Object.assign(attrs, {
        fill: "none",
        stroke: color,
        "stroke-width": nonScaling ? onScreen : strokeAttr,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        pathLength: 100,
        "stroke-dasharray": dash,
        "data-dash": dash,
      });
    }
    parts.push({ tag, attrs });
  }

  return {
    svgAttrs: {
      viewBox: `${inset} ${inset} ${visible} ${visible}`,
      width: size,
      height: size,
      fill: "none",
      "data-icon": name,
    },
    mask,
    parts,
    strokeAttr,
    strokeOnScreen: onScreen,
  };
}
