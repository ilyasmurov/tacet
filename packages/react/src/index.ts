// tacet-react — the Tacet icon set for React.

export { Icon, Icon as TacetIcon, canAnimateOnMount, reverse } from "./Icon.js";
export type { IconProps, IconVariant, AnimMode } from "./Icon.js";
export { Digits } from "./Digits.js";
export type { DigitsProps } from "./Digits.js";
export type { DigitsTransition } from "tacet-core";
export { Text } from "./Text.js";
export type { TextProps } from "./Text.js";
export type { TextTransition } from "tacet-core";
export { TextField } from "./TextField.js";
export type { TextFieldProps } from "./TextField.js";

// Core data and helpers, so a gallery or a generator needs no second package.
export { iconNames, hasIcon, strokeOnScreen, STROKE_AT_24, ACCENT_VAR } from "tacet-core";
