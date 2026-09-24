// tacet-element — <tacet-icon>, <tacet-digits> and <tacet-text> for projects
// without React.
//
// Importing the package registers the elements on its own: in markup that is
// usually what people expect. Need a different tag — call defineTacetIcon("my-icon"),
// defineTacetDigits("my-number") or defineTacetText("my-text").

import { defineTacetIcon } from "./TacetIconElement.js";
import { defineTacetDigits } from "./TacetDigitsElement.js";
import { defineTacetText } from "./TacetTextElement.js";

export { TacetIconElement, defineTacetIcon } from "./TacetIconElement.js";
export { TacetDigitsElement, defineTacetDigits } from "./TacetDigitsElement.js";
export { TacetTextElement, defineTacetText } from "./TacetTextElement.js";
export { iconNames, hasIcon, reverse, strokeOnScreen, ACCENT_VAR } from "tacet-core";

defineTacetIcon();
defineTacetDigits();
defineTacetText();
