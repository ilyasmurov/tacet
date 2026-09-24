// tacet-core — the set's data and engine. No React, no dependencies of any kind.

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

export {
  digitsMarkup, parseDigits, slotSpec, DIGIT_ADVANCE, COLON_ADVANCE, SLOT_CLASS,
} from "./digitsLayout.js";
export type { DigitsRenderOpts, DigitsTransition, SlotSpec } from "./digitsLayout.js";

export { createDigits, DIGIT_TIMING } from "./digits.js";
export type { DigitsController, DigitsOptions } from "./digits.js";

export {
  normaliseText, textLayout, textMarkup, SPACE_ADVANCE, GLYPH_CLASS, WORD_CLASS, SPACE_CLASS,
} from "./textLayout.js";
export type { TextRenderOpts, TextTransition, TextGlyph, TextLayoutResult } from "./textLayout.js";
export { glyphForChar } from "./textChars.js";

export { createText, TEXT_TIMING } from "./text.js";
export type { TextController, TextOptions } from "./text.js";

export { createTextField, fieldChars, CARET_TIMING } from "./textField.js";
export type { TextFieldController } from "./textField.js";
