// tacet-element — <tacet-icon> для проектов без React.
//
// Импорт пакета регистрирует элемент сам: в разметке это чаще всего то, чего
// от него и ждут. Нужен другой тег — зови defineTacetIcon("my-icon").

import { defineTacetIcon } from "./TacetIconElement.js";

export { TacetIconElement, defineTacetIcon } from "./TacetIconElement.js";
export { iconNames, hasIcon, reverse, strokeOnScreen, ACCENT_VAR } from "tacet-core";

defineTacetIcon();
