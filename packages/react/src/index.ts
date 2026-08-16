// tacet — набор иконок для React.

export { Icon, Icon as TacetIcon, canAnimateOnMount, reverse } from "./Icon.js";
export type { IconProps, IconVariant, AnimMode } from "./Icon.js";

// Данные и утилиты ядра — чтобы за галереей и генерацией не тянуть второй пакет.
export { iconNames, hasIcon, strokeOnScreen, STROKE_AT_24, ACCENT_VAR } from "tacet-core";
