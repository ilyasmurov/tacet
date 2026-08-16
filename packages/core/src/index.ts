// tacet-core — данные набора и движок. Ни React, ни любых других зависимостей.

export { ICONS, ANIM, SOLID_BY_DEFAULT } from "./data.js";
export type { Gap, Part, IconDef, IconName, AnimMode, AnimCfg } from "./data.js";

export {
  STROKE_AT_24, STROKE_EXPONENT, strokeOnScreen, normalizeSize, insetFor, dashFor,
} from "./stroke.js";
export type { StrokeOpts } from "./stroke.js";

export { renderSpec, hasIcon, iconNames, ACCENT_VAR, BODY_CLASS, SVG_STYLE } from "./renderSpec.js";
export type { RenderOpts, RenderResult, ElementSpec, MaskSpec, IconVariant } from "./renderSpec.js";
export { toReactAttrs, toReactAttrName } from "./reactAttrs.js";
export { META, hasMeta, searchIcons } from "./meta.js";
export type { IconMeta } from "./meta.js";

export {
  animate, prepare, reverse, resetAnimation, resolveAnimateCfg,
  canAnimateOnMount, prefersReducedMotion,
} from "./animate.js";
export type { AnimateCfg, ResolvedAnimateCfg } from "./animate.js";
