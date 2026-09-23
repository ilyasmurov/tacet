// tacet-element — <tacet-icon> and <tacet-digits> for projects without React.
//
// Importing the package registers both elements on its own: in markup that is
// usually what people expect. Need a different tag — call defineTacetIcon("my-icon")
// or defineTacetDigits("my-number").

import { defineTacetIcon } from "./TacetIconElement.js";
import { defineTacetDigits } from "./TacetDigitsElement.js";

export { TacetIconElement, defineTacetIcon } from "./TacetIconElement.js";
export { TacetDigitsElement, defineTacetDigits } from "./TacetDigitsElement.js";
export { iconNames, hasIcon, reverse, strokeOnScreen, ACCENT_VAR } from "tacet-core";

defineTacetIcon();
defineTacetDigits();
