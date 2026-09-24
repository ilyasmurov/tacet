// tacet-element — <tacet-icon>, <tacet-digits>, <tacet-text>,
// <tacet-text-field> and <tacet-digits-field> for projects without React.
//
// Importing the package registers the elements on its own: in markup that is
// usually what people expect. Need a different tag — call defineTacetIcon("my-icon"),
// defineTacetDigits("my-number"), defineTacetText("my-text"),
// defineTacetTextField("my-field") or defineTacetDigitsField("my-count").

import { defineTacetIcon } from "./TacetIconElement.js";
import { defineTacetDigits } from "./TacetDigitsElement.js";
import { defineTacetText } from "./TacetTextElement.js";
import { defineTacetTextField } from "./TacetTextFieldElement.js";
import { defineTacetDigitsField } from "./TacetDigitsFieldElement.js";

export { TacetIconElement, defineTacetIcon } from "./TacetIconElement.js";
export { TacetDigitsElement, defineTacetDigits } from "./TacetDigitsElement.js";
export { TacetTextElement, defineTacetText } from "./TacetTextElement.js";
export { TacetTextFieldElement, defineTacetTextField } from "./TacetTextFieldElement.js";
export { TacetDigitsFieldElement, defineTacetDigitsField } from "./TacetDigitsFieldElement.js";
export { iconNames, hasIcon, reverse, strokeOnScreen, ACCENT_VAR } from "tacet-core";

defineTacetIcon();
defineTacetDigits();
defineTacetText();
defineTacetTextField();
defineTacetDigitsField();
