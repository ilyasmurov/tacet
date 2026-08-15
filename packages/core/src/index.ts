// @tacet/core — данные набора и движок. Ни React, ни любых других зависимостей.

export { ICONS, ANIM, SOLID_BY_DEFAULT } from "./data.js";
export type { Gap, Part, IconDef, IconName, AnimMode, AnimCfg } from "./data.js";

export { STROKE_AT_24, STROKE_EXPONENT, strokeOnScreen, insetFor, dashFor } from "./stroke.js";
export type { StrokeOpts } from "./stroke.js";

export { renderSpec, hasIcon, iconNames, ACCENT_VAR } from "./renderSpec.js";
export { toReactAttrs, toReactAttrName } from "./reactAttrs.js";
export type { RenderOpts, RenderResult, ElementSpec, MaskSpec, IconVariant } from "./renderSpec.js";

export {
  animate, prepare, reverse, resolveAnimateCfg,
  canAnimateOnMount, prefersReducedMotion,
} from "./animate.js";
export type { AnimateCfg } from "./animate.js";
